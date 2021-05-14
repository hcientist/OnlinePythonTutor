# Ruby backend for Online "Python" Tutor
# created on 2015-06-29 by Philip Guo
# first deployed on 2015-07-15
#
# WARNING: this script only works on a *hacked version* of Ruby 2.X since
# we use the TracePoint API (standard in 2.X) and custom fields such as
# binding::frame_id (only available in our hacked version).
# See custom-ruby-interpreter/ for details.

# TODO
#
# - support gets() for taking user input using the restart hack mechanism
#   that we used for Python. user input stored in $_
#
# Limitations/quirks:
#
# - code keeps executing for a few more lines after an exception;
#   dunno if that's standard Ruby behavior or not
#
# - if you write, say, "require 'date'", it will pull in classes from
#   the date module into globals, which might make the display HUGE
#   with way too many attributes. this is a general problem that
#   manifests in other languages as well.

# 2016-05-01: super hacky -- prefaced all global variables with a munged
# name prefix like '__opt_global__' to prevent name clashes with
# the user's script. right now the script is apparently eval'ed in the
# same scope as the tracer, so it can shadow the tracer's variables,
# leading to bad results. the real fix is to get the bindings right, but
# for now, this kludgy hack will have to do.


require 'json'
require 'optparse'
require 'set'
require 'stringio'

require 'debug_inspector' # gem install debug_inspector, use on Ruby 2.X

# always preface globals with __opt_global__ (hacky!)
__opt_global__trace_output_fn = 'stdout' # default
__opt_global__script_name = nil
__opt_global__cod = nil

OptionParser.new do |opts|
  opts.banner = "Usage: ./ruby pg_logger.rb [options]"

  opts.on("-t", "--tracefile", "Create a test-trace.js trace file") do |t|
    __opt_global__trace_output_fn = "../../../v3/test-trace.js" if t
  end

  opts.on("-f", "--file FILE", "Execute a .rb file") do |s|
    __opt_global__script_name = s
  end

  opts.on("-c", "--code CODE", String, "Execute Ruby code from string") do |c|
    __opt_global__cod = c
  end

end.parse!

# -c gets precedence over -f
if !__opt_global__cod
  __opt_global__cod = File.open(__opt_global__script_name).read
end

# always preface globals with __opt_global__ (hacky!)
__opt_global__cur_trace = []
__opt_global__res = {'code' => __opt_global__cod.dup, # make a snapshot of the code NOW before it's modified
       'trace' => __opt_global__cur_trace}

# canonicalize to pretty-print
__opt_global__cur_frame_id = 1
__opt_global__ordered_frame_ids = {}

__opt_global__stdout_buffer = StringIO.new

__opt_global__n_steps = 0
#__opt_global__MAX_STEPS = 300
__opt_global__MAX_STEPS = 1000 # on 2016-05-01, I increased the limit from 300 to 1000 for Ruby due to popular user demand! and I also improved the warning message

__opt_global__n_lines_added = nil

class MaxStepsException < RuntimeError
end

OPT_GLOBAL_PRIMITIVES = [Fixnum, Float, String, TrueClass, FalseClass, NilClass]

# ported from ../../../v3/pg_encoder.py
class ObjectEncoder
  def initialize
    # Key: canonicalized small ID
    # Value: encoded (compound) heap object
    @encoded_heap_objects = {}

    @id_to_small_IDs = {}
    @cur_small_ID = 1
  end

  def get_heap
    @encoded_heap_objects
  end

  def reset_heap
    # VERY IMPORTANT to reassign to a NEW empty hash rather than just
    # clearing the existing hash, since get_heap() could have been
    # called earlier to return a reference to a previous heap state
    @encoded_heap_objects = {}
  end

  # return either a primitive object or an object reference;
  # and as a side effect, update encoded_heap_objects
  def encode(dat)
    if OPT_GLOBAL_PRIMITIVES.include? dat.class
      if dat.class == Float
        if dat == Float::INFINITY
          return ['SPECIAL_FLOAT', 'Infinity']
        elsif dat == (-1 * Float::INFINITY)
          return ['SPECIAL_FLOAT', '-Infinity']
        elsif dat.nan?
          return ['SPECIAL_FLOAT', 'NaN']
        elsif dat == dat.to_i
          # (this way, 3.0 prints as '3.0' and not as 3, which looks like an int)
          return ['SPECIAL_FLOAT', '%.1f' % dat]
        end
      elsif dat.class == String
        # annoying! strings are mutable, so need to make
        # a duplicate to snapshot the current value!
        return dat.dup
      end

      return dat
    else
      my_id = dat.object_id

      my_small_id = @id_to_small_IDs[my_id]
      if !my_small_id
        my_small_id = @cur_small_ID
        @id_to_small_IDs[my_id] = @cur_small_ID
        @cur_small_ID += 1
      end

      ret = ['REF', my_small_id]

      # punt early if you've already encoded this object
      return ret if @encoded_heap_objects.include? my_small_id

      new_obj = []
      @encoded_heap_objects[my_small_id] = new_obj

      # otherwise encode it in the heap and return ret
      if dat.class == Array
        new_obj << 'LIST'
        dat.each { |e| new_obj << encode(e) }
      elsif dat.class == Hash
        new_obj << 'DICT'
        dat.each { |k, v| new_obj << [encode(k), encode(v)] }
      elsif dat.class == Set
        new_obj << 'SET'
        dat.each { |e| new_obj << encode(e) }
      elsif dat.class == Range || dat.class == Symbol || dat.class == Regexp
        # display these simple types as-is without any frills
        new_obj << dat.class.to_s
        new_obj << dat.inspect
      elsif dat.class == Method || dat.class == UnboundMethod
        # just use 'FUNCTION' for simplicity, even though it masks some
        # subtleties of methods, unbound methods, etc.
        new_obj << 'FUNCTION'
        new_obj << dat.name
        new_obj << '' # parent frame ID
      elsif dat.class == Proc
        new_obj << dat.class.to_s
        if dat.lambda?
          new_obj << ("Lambda on line %d" % dat.source_location[1])
        else
          new_obj << ("Proc on line %d" % dat.source_location[1])
        end
      elsif dat.class == Class
        new_obj << 'CLASS'
        new_obj << dat.to_s
        sups = []
        sups << dat.superclass if dat.superclass != Object
        new_obj << sups

        encoded_constants = []
        encoded_class_methods = []
        encoded_instance_methods = []
        encoded_class_variables = []
        encoded_instance_variables = []

        dat.constants.each do |e|
          encoded_constants << [e.to_s, encode(dat.const_get(e))]
        end

        # TODO: what about if you override a class method that your
        # superclass defines? will we run into problems then?
        my_class_methods = dat.methods - dat.superclass.methods
        my_class_methods.each do |e|
          encoded_class_methods << ['self.' + e.to_s, encode(dat.method(e))]
        end

        # apparently there are no protected class methods
        my_private_class_methods = dat.private_methods - dat.superclass.private_methods
        my_private_class_methods.each do |e|
          encoded_class_methods << ['self.' + e.to_s + ' [private]', encode(dat.method(e))]
        end

        # separately handle public, protected, and private
        dat.public_instance_methods.each do |e|
          m = dat.instance_method(e)
          # only add if this method belongs to YOU and not to a superclass
          if m.owner == dat
            # use instance_method to get the unbound method
            # http://ruby-doc.org/core-2.2.0/UnboundMethod.html
            encoded_instance_methods << [e.to_s, encode(m)]
          end
        end
        dat.protected_instance_methods.each do |e|
          m = dat.instance_method(e)
          if m.owner == dat
            encoded_instance_methods << [e.to_s + ' [protected]', encode(m)]
          end
        end
        dat.private_instance_methods.each do |e|
          m = dat.instance_method(e)
          if m.owner == dat
            encoded_instance_methods << [e.to_s + ' [private]', encode(m)]
          end
        end

        dat.class_variables.each do |e|
          encoded_class_variables << [e.to_s, encode(dat.class_variable_get(e))]
        end

        dat.instance_variables.each do |e|
          encoded_instance_variables << [e.to_s, encode(dat.instance_variable_get(e))]
        end

        new_obj.concat(encoded_constants)
        new_obj.concat(encoded_class_methods)
        new_obj.concat(encoded_instance_methods)
        new_obj.concat(encoded_class_variables)
        new_obj.concat(encoded_instance_variables)
      elsif dat.class == Module
        new_obj << 'INSTANCE'
        new_obj << dat.class.to_s

        encoded_constants = []
        encoded_instance_methods = []
        encoded_class_variables = []
        encoded_instance_variables = []

        dat.constants.each do |e|
          encoded_constants << [e.to_s, encode(dat.const_get(e))]
        end

        # TODO: maybe remove duplication from included modules?

        dat.instance_methods.each do |e|
          # use instance_method to get the unbound method
          # http://ruby-doc.org/core-2.2.0/UnboundMethod.html
          encoded_instance_methods << [e.to_s, encode(dat.instance_method(e))]
        end

        dat.class_variables.each do |e|
          encoded_class_variables << [e.to_s, encode(dat.class_variable_get(e))]
        end

        dat.instance_variables.each do |e|
          encoded_instance_variables << [e.to_s, encode(dat.instance_variable_get(e))]
        end

        new_obj.concat(encoded_constants)
        new_obj.concat(encoded_instance_methods)
        new_obj.concat(encoded_class_variables)
        new_obj.concat(encoded_instance_variables)
      else
        # concise case: instance that doesn't use the default Kernel to_s
        # (i.e., either it or its superclass defined a custom to_s):
        if dat.method(:to_s).owner != Kernel
          new_obj << 'INSTANCE_PPRINT'
          new_obj << dat.class.to_s
          new_obj << dat.to_s
        else
          new_obj << 'INSTANCE'
          new_obj << dat.class.to_s

          # catch-all case: in Ruby, everything is an object
          my_inst_vars = dat.instance_variables

          encoded_instance_variables = []

          my_inst_vars.each do |e|
            encoded_instance_variables << [e.to_s, encode(dat.instance_variable_get(e))]
          end

          new_obj.concat(encoded_instance_variables)

          # for brevity, put methods in the class, not in instances
        end
      end

      return ret
    end
  end
end

# do NOT rename this anything other than pg_encoder since we refer to it
# later by name
__opt_global__pg_encoder = ObjectEncoder.new


# end all of my own definitions here so that I can set the following vars ...

# collect the sets of these variables RIGHT BEFORE the user's code runs
# so that we can do a set difference later to see what the user defined
base_globals_set = global_variables
base_constants_set = Module.constants
base_inst_vars_set = self.instance_variables # toplevel instance variables are set on 'self'
base_class_vars_set = Object.class_variables # toplevel class variables are set on 'Object'
base_methods_set  = Object.private_methods # toplevel defined methods are set on 'Object'


# do NOT rename this anything other than __opt_global__pg_tracer since we refer to it
# later by name
__opt_global__pg_tracer = TracePoint.new(:line,:class,:end,:call,:return,:raise,:b_call,:b_return) do |tp|
  next if tp.path != '(eval)' # 'next' is a 'return' from a block

  raise MaxStepsException if __opt_global__n_steps > __opt_global__MAX_STEPS

  # TODO: look into tp.defined_class and tp.method_id attrs

  __opt_global__pg_encoder.reset_heap() # VERY VERY VERY IMPORTANT, or else we won't properly
                          # capture heap object mutations in the trace!

  retval = nil
  if tp.event == :return || tp.event == :b_return
    retval = __opt_global__pg_encoder.encode(tp.return_value)
  end

  evt_type = case tp.event
             when :line then "step_line"
             when :call, :b_call, :class then "call"
             when :return, :b_return, :end then "return"
             when :raise then "exception"
             end

  entry = {}

  entry['func_name'] = '<toplevel>' #tp.method_id
  entry['line'] = tp.lineno
  entry['event'] = evt_type

  # make a copy to take a snapshot at this point in time
  entry['stdout'] = __opt_global__stdout_buffer.string.dup

  stack = []
  entry['stack_to_render'] = stack
  entry['heap'] = __opt_global__pg_encoder.get_heap

  # globals
  globals = {}
  entry['globals'] = globals

  true_globals = (global_variables - base_globals_set) # set difference
  entry['ordered_globals'] = true_globals.map { |e| e.to_s }

  true_globals.each.with_index do |varname, i|
    val = eval(varname.to_s) # TODO: is there a better way? this seems hacky!
    globals[varname.to_s] = __opt_global__pg_encoder.encode(val)
  end

  # toplevel constants (stuff them in globals)
  toplevel_constants = (Module.constants - base_constants_set) # set difference
  entry['ordered_globals'].concat(toplevel_constants.map { |e| e.to_s })
  toplevel_constants.each do |varname|
    val = Module.const_get(varname)
    globals[varname.to_s] = __opt_global__pg_encoder.encode(val)
  end

  # toplevel methods, class vars, and instance vars
  # just stuff them in globals, even though technically they're not
  # really global variables in Ruby; they're part of the weird 'self'
  # instance and also 'Object' itself ... quirky
  toplevel_methods = Object.private_methods - base_methods_set
  toplevel_class_vars = Object.class_variables - base_class_vars_set
  toplevel_inst_vars = self.instance_variables - base_inst_vars_set

  entry['ordered_globals'].concat(toplevel_methods.map { |e| e.to_s })
  entry['ordered_globals'].concat(toplevel_class_vars.map { |e| e.to_s })
  entry['ordered_globals'].concat(toplevel_inst_vars.map { |e| e.to_s })


  toplevel_methods.each do |varname|
    val = Object.method(varname)
    globals[varname.to_s] = __opt_global__pg_encoder.encode(val)
  end

  toplevel_class_vars.each do |varname|
    val = Object.class_variable_get(varname)
    globals[varname.to_s] = __opt_global__pg_encoder.encode(val)
  end

  toplevel_inst_vars.each do |varname|
    val = self.instance_variable_get(varname)
    globals[varname.to_s] = __opt_global__pg_encoder.encode(val)
  end

  if tp.event == :raise
    entry['exception_msg'] = tp.raised_exception
  end

  # adapted from https://github.com/ko1/pretty_backtrace/blob/master/lib/pretty_backtrace.rb
  def self.iseq_local_variables iseq
    _,_,_,_,arg_info,name,path,a_path,_,type,lvs, * = iseq.to_a
    lvs
  end

  # adapted from https://github.com/ko1/pretty_backtrace/blob/master/lib/pretty_backtrace.rb
  RubyVM::DebugInspector.open do |dc|
    locs = dc.backtrace_locations

    locs.each.with_index do |loc, i|
      # ignore first two boilerplate frames
      next if i < 2
      # and totally punt as soon as you hit the 'eval' frame
      break if /in `eval'/ =~ loc.to_s

      stack_entry = {}
      stack_entry['is_highlighted'] = false # set the last entry to true later

      is_main = false

      iseq = dc.frame_iseq(i)
      if !iseq
        # if you're, say, in a built-in operator like :/ (division)
        # totally punt since we can't get any useful info
        next
      else
        b = dc.frame_binding(i)

        # frame_id field exists only in my hacked Ruby interpreter!
        canonical_fid = __opt_global__ordered_frame_ids[b.frame_id]
        if !canonical_fid
          canonical_fid = __opt_global__cur_frame_id
          __opt_global__ordered_frame_ids[b.frame_id] = __opt_global__cur_frame_id
          __opt_global__cur_frame_id += 1
        end

        # special-case handling for the toplevel '<main>' frame
        # (NB: don't do this for now)
        #is_main = true if loc.label == '<main>'

        stack_entry['func_name'] = '%s:%d' % [loc.label, loc.lineno]


        stack_entry['frame_id'] = canonical_fid
        stack_entry['unique_hash'] = stack_entry['func_name'] + '_f' + stack_entry['frame_id'].to_s

        # unsupported features
        stack_entry['is_parent'] = false
        stack_entry['is_zombie'] = false
        stack_entry['parent_frame_id_list'] = []

        # these include only your own frame's locals
        lvs = iseq_local_variables(iseq)
        # filter out weird Fixnum local variable names, which seem to be
        # created when iterating over Range values ... weird?!?
        lvs = lvs.select{ |e| !e.is_a? Fixnum}
        lvs_val = lvs.inject({}){|r, lv|
          begin
            begin
              v = b.local_variable_get(lv)
              r[lv] = __opt_global__pg_encoder.encode(v)
            rescue
              # iterating over range values will make 'lv' into
              # potentially literal values such as integers, so they
              # don't make sense as keys in local_variable_get
              #
              # ignore
            end
          rescue NameError
            # ignore
          end
          r # very important!
        }

        stack_entry['ordered_varnames'] = lvs.map { |e| e.to_s }
        stack_entry['encoded_locals'] = lvs_val

        # handle closures ...
        # these also include variables captured in lexical parents' frames!!!
        all_local_vars = b.local_variables

        # OK this is RIDICULOUSLY RIDICULOUSLY hacky. if this frame is
        # defined at the toplevel, then its parent frame will include
        # __opt_global__pg_tracer and __opt_global__pg_encoder, which is defined in THIS VERY FILE!!!
        # if that's the case, then totally punt since we don't want to
        # print out spurious data that's not even in the user's program.
        # ughhh this is sooooooo hacky!
        if (!all_local_vars.include?(:__opt_global__pg_tracer) &&
            !all_local_vars.include?(:__opt_global__pg_encoder))
          parent_frame_local_vars = (all_local_vars - lvs)
          parent_lvs_val = parent_frame_local_vars.inject(lvs_val){|r, lv|
            begin
              varname = 'parent:' + lv.to_s
              v = b.local_variable_get(lv)
              r[varname] = __opt_global__pg_encoder.encode(v)
              stack_entry['ordered_varnames'] << varname
            rescue NameError
              # ignore
            end
            r # very important!
          }
        end

        # get the value of 'self' as seen by this frame
        my_self = b.eval('self')
        if my_self != self # ignore default global 'self' for brevity
          stack_entry['ordered_varnames'].insert(0, 'self') # insert at front
          stack_entry['encoded_locals']['self'] = __opt_global__pg_encoder.encode(my_self)
        end

        # just fold everything into globals rather than creating a
        # separate (redundant) frame for '<main>'
        # (NB: don't do this for now ... just relabel "Global frames" as
        # 'Global Object' or something)
        if is_main
          entry['ordered_globals'].concat(stack_entry['ordered_varnames'])
          entry['globals'].update(stack_entry['encoded_locals'])
        end
      end

      # no separate frame for main since its local variables were folded
      # into globals
      if !is_main
        stack << stack_entry
      end

    end
  end

  # massage the topmost stack entry
  if stack.length > 0
    stack[0]['is_highlighted'] = true
    if tp.event == :return || tp.event == :b_return
      stack[0]['ordered_varnames'] << '__return__'
      stack[0]['encoded_locals']['__return__'] = retval
    end
  end

  # now REVERSE the stack so that it grows downward
  stack.reverse!

  __opt_global__n_steps += 1

  __opt_global__cur_trace << entry
end


begin
  # we are redirecting stdout so we need to print all warnings to stderr!
  __opt_global__pg_tracer.enable
  $stdout = __opt_global__stdout_buffer

  # super-hack: add an extra 'nil' line to execute at the end so that the
  # tracer can easily pick up on the final executed line in '(eval)'
  # - this isn't a 'real' line number in the user's code since we've
  #   inserted an extra line
  if __opt_global__cod[-1] == "\n"
    __opt_global__cod << "nil"
    __opt_global__n_lines_added = 1
  else
    __opt_global__cod << "\nnil"
    __opt_global__n_lines_added = 1 # pretty sure this is 1 and not 2
  end

  eval(__opt_global__cod) # the filename of the user's code is '(eval)'
  __opt_global__pg_tracer.disable
rescue SyntaxError
  $stdout = STDOUT
  exc_object = $!

  raw_exc_message = exc_object.message
  # parse out the line number and message from raw_exc_message. e.g.,:
  # "(eval):11: syntax error, unexpected end-of-input, expecting keyword_end"
  # - we want to extract out the line number of 11 and the message of
  #   "syntax error, unexpected end-of-input, expecting keyword_end"
  /[:](\d+)[:] (.*)$/ =~ raw_exc_message
  lineno = $1.to_i
  exc_message = $2

  # From: https://github.com/pgbovine/OnlinePythonTutor/blob/master/v3/docs/opt-trace-format.md
  # "If the trace has exactly 1 entry and it's an uncaught_exception, then
  # the OPT frontend doesn't switch to the visualization at all ...
  # instead it displays a "syntax error"-like thingy in the code editor.
  # It will highlight the faulting line, indicated by the line field and
  # display exception_msg there. So if you want to indicate a syntax error,
  # then create a trace with exactly ONE entry that's an uncaught_exception.
  singleton_entry = {}
  # mutate __opt_global__cur_trace in place rather than reassigning, since __opt_global__res already includes it
  __opt_global__cur_trace.clear
  __opt_global__cur_trace << singleton_entry
  singleton_entry['event'] = 'uncaught_exception'
  singleton_entry['line'] = lineno
  singleton_entry['exception_msg'] = exc_message
rescue MaxStepsException
  $stdout = STDOUT

  # take the final trace entry & make it into a instruction_limit_reached event
  if __opt_global__cur_trace.length > 0
    __opt_global__cur_trace[-1]['event'] = 'instruction_limit_reached'
    __opt_global__cur_trace[-1]['exception_msg'] = "Stopped after running %d steps. Please shorten your code,\nsince Python Tutor is not designed to handle long-running code." % __opt_global__MAX_STEPS
  end
rescue
  $stdout = STDOUT
  # ignore since we've already handled a :raise event in the trace by now
  STDERR.puts $! # but still print the error to ease debugging
  STDERR.puts $!.backtrace
ensure
  $stdout = STDOUT

  # super hack -- to account for the fact that we added an extra 'nil'
  # instruction at the very end of the user's code, we will set the
  # final instruction's line number to the last line of the file
  # (only do this if the trace isn't a single element, which likely
  # indicates some sort of uncaught_exception)
  if __opt_global__cur_trace.length > 1 && __opt_global__n_lines_added
    __opt_global__cur_trace[-1]['line'] -= __opt_global__n_lines_added
  end

  # postprocessing into a trace
  trace_json = JSON.pretty_generate(__opt_global__res)
  if __opt_global__trace_output_fn == 'stdout'
    STDOUT.write(trace_json)
  else
    File.open(__opt_global__trace_output_fn, 'w') do |f|
      f.write('var trace = ' + trace_json)
    end
    puts "Trace written to " + __opt_global__trace_output_fn
  end
end

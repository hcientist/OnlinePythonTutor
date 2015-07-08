2015-07-07

To build the custom Ruby interpreter - use ruby-2.2.2:
  wget http://cache.ruby-lang.org/pub/ruby/2.2/ruby-2.2.2.tar.gz
  tar -zxvf ruby-2.2.2.tar.gz
  cp altered-files/* ruby-2.2.2/
  cd ruby-2.2.2/
  mkdir $HOME/ruby-2.2.2-custom-OPT/
  ./configure --prefix=$HOME/ruby-2.2.2-custom-OPT/
  make
  make install # don't forget this step!

To recompile, run:
  make install

To run the hacked Ruby, run binaries in:
  ~/ruby-2.2.2-custom-OPT/bin/

The binding object should now have a new frame_id field

e.g.,:
  ~/ruby-2.2.2-custom-OPT/bin/ruby pg_logger.rb tests/recursive-fact.rb


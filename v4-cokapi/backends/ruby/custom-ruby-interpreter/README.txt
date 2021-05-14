2015-07-07

To build the custom Ruby interpreter - use ruby-2.2.2 in this directory:
  tar -zxvf ruby-2.2.2.tar.gz
  cp altered-files/* ruby-2.2.2/
  cd ruby-2.2.2/
  mkdir ../ruby-2.2.2-custom-OPT/
  ./configure --prefix=`pwd`/../ruby-2.2.2-custom-OPT/
  make
  make install # don't forget this step!

To recompile, run:
  make install

To run the hacked Ruby, run binaries in:
  `pwd`/ruby-2.2.2-custom-OPT/bin/

The binding object should now have a new frame_id field, which
../pg_logger.rb needs

e.g.,:
  `pwd`/ruby-2.2.2-custom-OPT/bin/ruby pg_logger.rb tests/recursive-fact.rb


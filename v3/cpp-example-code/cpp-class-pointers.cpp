// Example C++ code for OPT
// From: http://www.cprogramming.com/tutorial/lesson12.html

#include <iostream>

class Computer {
public:
  Computer();
  ~Computer();
  void setspeed ( int p );
  int readspeed();
protected:
  int processorspeed;
};

Computer::Computer() {
  processorspeed = 0;
}

Computer::~Computer() {
  //Destructors do not accept arguments
}

void Computer::setspeed ( int p ) {
  processorspeed = p;
}

int Computer::readspeed()  {
  return processorspeed;
}

int main() {
  Computer compute;  
  compute.setspeed(100); 
  int s = compute.readspeed();

  Computer* pCompute = &compute;
  pCompute->setspeed(5000);
  s = pCompute->readspeed();

  Computer* heapCompute = new Computer;
  heapCompute->setspeed(30000);
  s = heapCompute->readspeed();

  delete heapCompute;
  return 0;
}

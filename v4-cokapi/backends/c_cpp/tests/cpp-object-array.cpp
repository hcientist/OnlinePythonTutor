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
  Computer* heapComputeArray = new Computer[5];
  heapComputeArray[1].setspeed(1);
  heapComputeArray[3].setspeed(3);
  heapComputeArray[5].setspeed(5);

  delete[] heapComputeArray;
  return 0;
}

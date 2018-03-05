// From the test suite of https://github.com/codespecs/daikon
//   daikon/tests/kvasir-tests/

#include <iostream>
#include <stdlib.h>
#include <string.h>

using namespace std;

class Stack {
 public:
  Stack(char* name, int maxSize);
  ~Stack();

  void push(int dat);
  int peek();
  int pop();

  char* getName();

  int getMaxElts();
  int getNumElts();

  static int getNumStacksCreated();

 private:
  int numElts;
  int maxElts;
  char* myName;
  int* stackRep;

  static int numStacksCreated;

  int privateStuff();
};


int Stack::numStacksCreated;

Stack::Stack(char* name, int maxSize) {
  myName = strdup(name);
  maxElts = maxSize;
  numElts = 0;
  Stack::numStacksCreated++;
  stackRep = new int[maxSize];
}

void Stack::push(int dat) {
  if (numElts < maxElts) {
    numElts++;
    stackRep[numElts - 1] = dat;
  }
}

int Stack::peek() {
  if (numElts > 0)
    return stackRep[numElts - 1];
  else
    return 0; // Yeah, I know, no error handling :)
}

int Stack::pop() {
  if (numElts > 0) {
    privateStuff();
    numElts--;
    return stackRep[numElts];
  }
  else
    return 0; // Yeah, I know, no error handling :)
}

char* Stack::getName() {return myName;}

int Stack::getMaxElts() {return maxElts;}
int Stack::getNumElts() {return numElts;}

int Stack::getNumStacksCreated() {
  return Stack::numStacksCreated;
}

Stack::~Stack() {
  delete[] stackRep;
  free(myName);
}

int Stack::privateStuff() {
  cout << "\n!PRIVATE!";
  return 42;
}


int main() {
  Stack first((char*)"My first stack", 10);

  first.push(101);
  first.push(102);
  first.push(103);
  first.push(104);
  first.push(105);

  // Pop the lines from the Stack and print them:
  cout << first.getName() << ": MAX_ELTS: " << first.getMaxElts();
  cout << ", NUM_STACKS_CREATED: " << first.getNumStacksCreated() << endl;
  int s;

  while((s = first.pop()) != 0) {
    cout << s << endl;
  }

  Stack second((char*)"My second stack", 5);

  second.push(1001);
  second.push(1002);
  second.push(1003);

  cout << second.getName() << ": MAX_ELTS: " << second.getMaxElts();
  cout << ", NUM_STACKS_CREATED: " << first.getNumStacksCreated() << endl;

  // Pop the lines from the Stack and print them:
  while((s = second.pop()) != 0) {
    cout << s << endl;
  }

  return 0;
}

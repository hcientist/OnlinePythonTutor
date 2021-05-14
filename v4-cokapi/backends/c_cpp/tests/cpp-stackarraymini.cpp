// From the test suite of https://github.com/codespecs/daikon
#include <stdlib.h>
#include <string.h>

class Stack {
  public:
    Stack(char* name, int maxSize);
   ~Stack();

   void push(int dat);
   int pop();

  private:
    int numElts;
    int maxElts;
    char* myName;
    int* stackRep;
};

Stack::Stack(char* name, int maxSize) {
  myName = strdup(name);
  maxElts = maxSize;
  numElts = 0;
  stackRep = new int[maxSize];
}

void Stack::push(int dat) {
  if (numElts < maxElts) {
    numElts++;
    stackRep[numElts - 1] = dat;
  }
}

int Stack::pop() {
  if (numElts > 0) {
    numElts--;
    return stackRep[numElts];
  }
  else
    return 0; // Yeah, I know, no error handling :)
}

Stack::~Stack() {
  delete[] stackRep;
  free(myName);
}


int main() {
  Stack first((char*)"First stack", 10);
  first.push(101);
  first.push(102);
  first.push(103);
  first.push(104);
  first.push(105);

  first.pop();
  first.pop();
  first.pop();

  Stack* second = new Stack((char*)"Second stack", 5);

  second->push(1001);
  second->push(1002);
  second->push(1003);

  second->pop();
  second->pop();
  second->pop();

  return 0;
}

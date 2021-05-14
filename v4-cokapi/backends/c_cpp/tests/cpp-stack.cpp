// From the test suite of https://github.com/codespecs/daikon
//   daikon/tests/kvasir-tests/

// Adapted for Kvasir regression tests by Philip Guo

//: C04:Stack.h
// From Thinking in C++, 2nd Edition
// Available at http://www.BruceEckel.com
// (c) Bruce Eckel 2000
// Copyright notice in Copyright.txt
// Nested struct in linked list

#include <stdlib.h>
#include <string.h>
#include <iostream>

using namespace std;

class Stack {
 public:
  void push(char* dat);
  char* peek();
  char* pop();
  char* getName();
  Stack(char* name);
  static int getNumStacksCreated();
  static int publicNumLinksCreated;
  ~Stack();

 private:
  int numElements;
  char* myName;
  static int numStacksCreated;
  int privateStuff();

  struct Link {
    char* data;
    Link* next;
    void initialize(char* dat, Link* nxt);
  }* head;
};


int Stack::numStacksCreated;
int Stack::publicNumLinksCreated;

int Stack::getNumStacksCreated() {
  return Stack::numStacksCreated;
}

void
Stack::Link::initialize(char* dat, Link* nxt) {
  data = dat;
  next = nxt;
}

Stack::Stack(char* name) {
  myName = strdup(name);
  Stack::numStacksCreated++;
  head = 0;
  numElements = 0;
}

Stack::~Stack() {
  free(myName);
}


char* Stack::getName() {
  cout << "Private stuff: " << privateStuff() << endl;
  return myName;
}

int Stack::privateStuff() {
  return 42;
}

void Stack::push(char* dat) {
  Link* newLink = new Link;
  newLink->initialize(dat, head);
  head = newLink;
  numElements++;
  Stack::publicNumLinksCreated++;
}

char* Stack::peek() {
  return head->data;
}

char* Stack::pop() {
  if(head == 0) return 0;
  char* result = head->data;
  Link* oldHead = head;
  head = head->next;
  delete oldHead;
  numElements--;
  return result;
}


int main() {
  Stack first((char*)"My first stack");

  first.push((char*)"First line");
  first.push((char*)"Second line");
  first.push((char*)"Third line");
  first.push((char*)"Fourth line");
  first.push((char*)"Fifth line");

  // Pop the lines from the Stack and print them:
  char* s;

  cout << first.getName() << ":" << endl;

  while((s = first.pop()) != 0) {
    cout << s << endl;
  }

  cout << "numStacksCreated: " << Stack::getNumStacksCreated() << endl;
  cout << "publicNumLinksCreated: " << Stack::publicNumLinksCreated << endl;

  Stack second((char*)"My second stack");

  second.push((char*)"Uno");
  second.push((char*)"Dos");
  second.push((char*)"Tres");
  second.push((char*)"Cuatro");

  cout << endl << second.getName() << ":" << endl;

  // Pop the lines from the Stack and print them:
  while((s = second.pop()) != 0) {
    cout << s << endl;
  }

  cout << "numStacksCreated: " << Stack::getNumStacksCreated() << endl;
  cout << "publicNumLinksCreated: " << Stack::publicNumLinksCreated << endl;
}

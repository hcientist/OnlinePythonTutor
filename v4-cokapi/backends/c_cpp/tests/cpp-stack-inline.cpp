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
#include <iostream>
#include <string.h>
using namespace std;

class Stack {
 private:
  static int numStacksCreated;

 public:
  static int publicNumLinksCreated;

  void push(char* dat) {
    Link* newLink = new Link;
    newLink->initialize(dat, head);
    head = newLink;
    numElements++;
    publicNumLinksCreated++;
  }

  char* peek() {
    return head->data;
  }

  char* pop() {
    if(head == 0) return 0;
    char* result = head->data;
    Link* oldHead = head;
    head = head->next;
    delete oldHead;
    numElements--;
    return result;
  }

  char* getName() {
    cout << "Private stuff: " << privateStuff() << endl;
    return myName;
  }

  Stack(char* name) {
    myName = strdup(name);
    numStacksCreated++;
    head = 0;
    numElements = 0;
  }

  static int getNumStacksCreated() {
    return numStacksCreated;
  }

  ~Stack() {
    free(myName);
  }

 private:


  int numElements;
  char* myName;

  int privateStuff() {
    return 42;
  }

  Stack(char* name, int x) {
      throw "should never get here";
  }

  struct Link {
    char* data;
    Link* next;
    void initialize(char* dat, Link* nxt) {
      data = dat;
      next = nxt;
    }
  }* head;

};


int Stack::numStacksCreated;
int Stack::publicNumLinksCreated;

int main() {
  Stack first((char *)"My first stack");

  first.push((char *)"First line");
  first.push((char *)"Second line");
  first.push((char *)"Third line");
  first.push((char *)"Fourth line");
  first.push((char *)"Fifth line");


  // THIS IS SUPER WEIRD! IF YOU COMMENT OUT THIS NEXT LINE AND DON'T
  // USE peek() AT ALL IN YOUR PROGRAM, AN ENTRY FOR IT WILL NOT
  // APPEAR ANYWHERE, NOT EVEN IN THE SYMBOL TABLE, SO FOR ALL INTENTS
  // AND PURPOSES, IT WON'T EXIST.  Interesting, huh?  But if it's
  // declared outside the class body, then it will exist
  // unconditionally.
  first.peek();

  // Pop the lines from the Stack and print them:
  char* s;

  cout << first.getName() << ":" << endl;

  while((s = first.pop()) != 0) {
    cout << s << endl;
  }

  cout << "numStacksCreated: " << Stack::getNumStacksCreated() << endl;
  cout << "publicNumLinksCreated: " << Stack::publicNumLinksCreated << endl;

  Stack second((char *)"My second stack");

  second.push((char *)"Uno");
  second.push((char *)"Dos");
  second.push((char *)"Tres");
  second.push((char *)"Cuatro");

  cout << endl << second.getName() << ":" << endl;

  // Pop the lines from the Stack and print them:
  while((s = second.pop()) != 0) {
    cout << s << endl;
  }

  cout << "numStacksCreated: " << Stack::getNumStacksCreated() << endl;
  cout << "publicNumLinksCreated: " << Stack::publicNumLinksCreated << endl;
}

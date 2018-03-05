#include <stdlib.h>

int main() {
  char *stack_animals[] = {
    "Bear", "Cat", "Dog"
  };

  char** heap_animals = malloc(10 * sizeof(*heap_animals));
  heap_animals[1] = "Dolphin";
  heap_animals[3] = "Orca";
  heap_animals[5] = "Whale";

  return 0;
}

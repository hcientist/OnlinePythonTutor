int main() {
  char *string = "The quick brown fox";
  memcpy(&string[4], "slow ", 5); // <-- not allowed!
  printf("%s\n", string);
  return 0;
}

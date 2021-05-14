int main() {
  char *src = "string with\200inside !"; // \200 is not printable in ascii
  return 0;
}

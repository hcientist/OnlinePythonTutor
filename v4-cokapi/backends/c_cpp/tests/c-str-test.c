// from a bug report
int main() {
  char str[]="he ll o";
    for (int i = 0; str[i] != '\0'; i++) {
        if (str[i] == ' ') {
            for (int j = i; str[j] != '\0'; j++) {
                str[j] = str[j + 1];
                str[j + 1] = ' '; // <-- this line could be problematic
            }
        }
    }
}

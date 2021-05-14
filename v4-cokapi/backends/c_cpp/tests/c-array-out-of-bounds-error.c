// from a bug report
void* sortedArrayPositionsChange(int *Arr, int len) {
    int i = 0, j = len - 1, t;
    if (len <= 0)
        return 0;
    else {
        for (i = len - 1; i > 0; i--) {
            if (Arr[i] < Arr[i - 1]) {
                j = i - 1;
                while (j >= 0 && Arr[i] < Arr[j])
                    j--;
                t = Arr[i];
                Arr[i] = Arr[j];
                Arr[j] = t; // <-- early termination error
                break;
            }
        }
    }
}

int main() {
    int Arr[5] = { 50, 20, 30, 40, 10 };
    sortedArrayPositionsChange(Arr, 5);
    return 0;
}

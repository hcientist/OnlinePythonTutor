# created by Peter Norvig
from watch_module import watchfn, watchedlist

# The decorator here says that the 0th positional argument should be a list;
# we will watch it, and the locals named i, mini, and min_index
@watchfn((watchedlist, 'i mini min_index'))
def selection_sort(A):
    for i in range(len(A)): #break
        mini = min(A[i:])
        min_index = A[i:].index(mini) + i   
        if i != min_index:
            A[min_index], A[i] = A[i], A[min_index]
    return A
            
print(selection_sort([3, 5, 2, 1, 8, 5, 9]))

## 2023-10-27 - [Optimize array aggregations]
**Learning:** In TypeScript arrays, multiple sequential `.filter().length` calls for distinct conditions iterate over the array multiple times, causing O(k*n) operations where k is the number of filters.
**Action:** Always aggregate distinct counts across the same array using a single-pass `reduce` or `for` loop to limit complexity to O(n).

## 2024-05-03 - Single-pass array aggregations
**Learning:** Found multiple instances where an array was traversed multiple times using `.filter().length` to count elements of different types. In TypeScript, this means traversing the array $O(k \cdot n)$ times for $k$ condition checks and generating intermediate arrays.
**Action:** Use a single-pass `reduce` to count elements of different categories simultaneously to achieve $O(n)$ complexity and avoid unnecessary array allocations.

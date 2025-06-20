const products = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `Sản phẩm ${i + 1}`,
  description: `Mô tả cho sản phẩm ${i + 1}`,
  price: (Math.floor(Math.random() * 90) + 10),
  image: `https://picsum.photos/seed/food${i + 1}/200/150`,
  tab: (i % 5) + 1 // Thêm thuộc tính tab để lọc theo tab menu
}));

export default products;
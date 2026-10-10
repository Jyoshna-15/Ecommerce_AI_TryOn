import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getProducts, Product } from "../../api/products";
import { useAuthStore } from "../../store/authStore";

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(products.map((p) => p.category)));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top greeting */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Hey {user?.name?.split(" ")[0] || "there"} 👋</Text>
          <Text style={styles.subGreeting}>Find your next favorite outfit</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Category chips */}
      {categories.length > 0 && (
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item }) => (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryText}>{item}</Text>
            </View>
          )}
        />
      )}

      {/* Product grid */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ color: "#999" }}>No products found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => router.push(`/product/${item.id}`)}
          >
            <Image source={{ uri: item.imageUrls[0] }} style={styles.image} />
            <View style={styles.cardBody}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.price}>₹{item.price}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 55 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { paddingHorizontal: 16, marginBottom: 16 },
  greeting: { fontSize: 22, fontWeight: "bold" },
  subGreeting: { fontSize: 13, color: "#888", marginTop: 2 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14 },
  categoryList: { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  categoryChip: {
    backgroundColor: "#000",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: { color: "#fff", fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  list: { paddingHorizontal: 10, paddingBottom: 20 },
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  image: { width: "100%", height: 190, backgroundColor: "#f5f5f5" },
  cardBody: { padding: 10 },
  name: { fontSize: 13, fontWeight: "600" },
  price: { fontSize: 14, color: "#000", fontWeight: "700", marginTop: 4 },
});
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getProductById, Product } from "../../api/products";
import { addToCart } from "../../api/cart";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
        if (data.sizes.length > 0) setSelectedSize(data.sizes[0]);
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {

        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      Alert.alert("Select a size", "Please choose a size before adding to cart");
      return;
    }

    setAdding(true);
    try {
      await addToCart(product!.id, selectedSize, 1);
      Alert.alert("Added to Cart", `${product!.name} (${selectedSize}) added successfully`, [
        { text: "Keep Browsing", style: "cancel" },
        { text: "Go to Cart", onPress: () => router.push("/cart") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );

  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.imageUrls[0] }} style={styles.image} />
      <View style={styles.details}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>₹{product.price}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <Text style={styles.sectionTitle}>Select Size</Text>
        <View style={styles.sizesRow}>
          {product.sizes.map((size) => (
            <TouchableOpacity
              key={size}
              style={[styles.sizeBox, selectedSize === size && styles.sizeBoxSelected]}
              onPress={() => setSelectedSize(size)}
            >
              <Text style={selectedSize === size ? styles.sizeTextSelected : undefined}>
                {size}
              </Text>
            </TouchableOpacity>
          ))}
        </View>


        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddToCart}
          disabled={adding}
        >
          {adding ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addButtonText}>Add to Cart</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  image: { width: "100%", height: 400, backgroundColor: "#eee" },
  details: { padding: 20 },
  name: { fontSize: 22, fontWeight: "bold" },
  price: { fontSize: 18, color: "#555", marginTop: 4 },
  description: { fontSize: 14, color: "#333", marginTop: 12, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 8 },
  sizesRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  sizeBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingVertical: 8,

    paddingHorizontal: 14,
  },
  sizeBoxSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  sizeTextSelected: {
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
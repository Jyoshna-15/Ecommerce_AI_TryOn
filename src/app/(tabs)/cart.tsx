import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getCart, updateCartItem, removeCartItem, CartItem } from "../../api/cart";

export default function CartScreen() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const data = await getCart();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch every time this screen comes into focus (e.g. after adding an item)
  useFocusEffect(
    useCallback(() => {

      fetchCart();
    }, [])
  );

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    await updateCartItem(itemId, newQty);
    fetchCart();
  };

  const handleRemove = async (itemId: string) => {
    await removeCartItem(itemId);
    fetchCart();
  };

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Cart</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <Image source={{ uri: item.product.imageUrls[0] }} style={styles.itemImage} />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={styles.itemSize}>Size: {item.size}</Text>
              <Text style={styles.itemPrice}>₹{item.product.price}</Text>

              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
                >
                  <Text style={styles.qtyButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.qtyButton}
                  onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
                >
                  <Text style={styles.qtyButtonText}>+</Text>

                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => handleRemove(item.id)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={styles.footer}>
        <Text style={styles.totalText}>Total: ₹{total}</Text>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => router.push("/checkout")}
        >
          <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 50 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#888" },
  header: { fontSize: 24, fontWeight: "bold", paddingHorizontal: 16, marginBottom: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  itemRow: {
    flexDirection: "row",

    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    alignItems: "center",
  },
  itemImage: { width: 70, height: 90, borderRadius: 8, backgroundColor: "#eee" },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 15, fontWeight: "600" },
  itemSize: { fontSize: 13, color: "#777", marginTop: 2 },
  itemPrice: { fontSize: 14, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: { fontSize: 16, fontWeight: "600" },
  qtyText: { fontSize: 15, fontWeight: "500" },
  removeText: { color: "#c00", fontSize: 13 },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    padding: 16,
    paddingBottom: 30,
  },
  totalText: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  checkoutButton: {
    backgroundColor: "#000",

    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  checkoutButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
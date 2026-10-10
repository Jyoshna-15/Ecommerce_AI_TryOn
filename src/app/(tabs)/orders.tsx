import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { getUserOrders } from "../../api/orders";

interface OrderItem {
  id: string;
  quantity: number;
  size: string;
  priceAtPurchase: number;
  product: {
    name: string;
    imageUrls: string[];
  };
}

interface Order {
  id: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: OrderItem[];
}

const statusColors: Record<string, string> = {
  PENDING: "#f5a623",
  PROCESSING: "#4a90d9",
  SHIPPED: "#4a90d9",
  OUT_FOR_DELIVERY: "#4a90d9",
  DELIVERED: "#2ecc71",
  CANCELLED: "#e74c3c",
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const data = await getUserOrders();
      setOrders(data);
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No orders yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Orders</Text>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item: order }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColors[order.status] || "#999" },
                ]}
              >
                <Text style={styles.statusText}>{order.status.replace(/_/g, " ")}</Text>
              </View>
            </View>

            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Image source={{ uri: item.product.imageUrls[0] }} style={styles.itemImage} />
                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.itemMeta}>
                    Size: {item.size} • Qty: {item.quantity}
                  </Text>
                  <Text style={styles.itemPrice}>₹{item.priceAtPurchase}</Text>
                </View>
              </View>
            ))}

            <View style={styles.orderFooter}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 50 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 16, color: "#888" },
  header: { fontSize: 24, fontWeight: "bold", paddingHorizontal: 16, marginBottom: 16 },
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  orderCard: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderDate: { fontSize: 13, color: "#777" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  itemRow: { flexDirection: "row", marginBottom: 10, alignItems: "center" },
  itemImage: { width: 50, height: 65, borderRadius: 6, backgroundColor: "#eee" },
  itemDetails: { flex: 1, marginLeft: 10 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemMeta: { fontSize: 12, color: "#888", marginTop: 2 },
  itemPrice: { fontSize: 13, marginTop: 2 },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, color: "#555" },
  totalAmount: { fontSize: 16, fontWeight: "bold" },
});
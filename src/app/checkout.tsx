import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getAddresses, createAddress, Address } from "../api/address";
import { createOrder } from "../api/orders";

export default function CheckoutScreen() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [placing, setPlacing] = useState(false);

  // New address form state
  const [label, setLabel] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const fetchAddresses = async () => {
    try {

      const data = await getAddresses();
      setAddresses(data);
      if (data.length > 0) setSelectedId(data[0].id);
      else setShowForm(true);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSaveAddress = async () => {
    if (!label || !addressLine || !city || !state || !pincode) {
      Alert.alert("Error", "Please fill all address fields");
      return;
    }
    try {
      const newAddress = await createAddress({ label, addressLine, city, state, pincode });
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedId(newAddress.id);
      setShowForm(false);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedId) {

      Alert.alert("Select an address", "Please choose or add a delivery address");
      return;
    }

    setPlacing(true);
    try {
      const order = await createOrder(selectedId);
      Alert.alert("Order Placed!", "Your order has been placed successfully", [
        { text: "OK", onPress: () => router.replace("/home") },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to place order");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Checkout</Text>

      <Text style={styles.sectionTitle}>Delivery Address</Text>

      {addresses.map((addr) => (

        <TouchableOpacity
          key={addr.id}
          style={[styles.addressCard, selectedId === addr.id && styles.addressCardSelected]}
          onPress={() => setSelectedId(addr.id)}
        >
          <Text style={styles.addressLabel}>{addr.label}</Text>
          <Text style={styles.addressText}>
            {addr.addressLine}, {addr.city}, {addr.state} - {addr.pincode}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={() => setShowForm(!showForm)}>
        <Text style={styles.addNewText}>
          {showForm ? "Cancel" : "+ Add New Address"}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Label (e.g. Home)" value={label} onChangeText={setLabel} />
          <TextInput style={styles.input} placeholder="Address Line" value={addressLine} onChangeText={setAddressLine} />
          <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
          <TextInput style={styles.input} placeholder="State" value={state} onChangeText={setState} />
          <TextInput style={styles.input} placeholder="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveAddress}>
            <Text style={styles.saveButtonText}>Save Address</Text>
          </TouchableOpacity>
        </View>
      )}


      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={handlePlaceOrder}
        disabled={placing}
      >
        {placing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>Place Order (Cash on Delivery)</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 50, paddingHorizontal: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  addressCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  addressCardSelected: { borderColor: "#000", backgroundColor: "#f5f5f5" },
  addressLabel: { fontWeight: "600" },
  addressText: { color: "#555", marginTop: 4, fontSize: 13 },
  addNewText: { color: "#007AFF", marginTop: 8, marginBottom: 16 },
  form: { marginBottom: 20 },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontWeight: "600" },
  placeOrderButton: {
    backgroundColor: "#000",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 40,
  },
  placeOrderText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
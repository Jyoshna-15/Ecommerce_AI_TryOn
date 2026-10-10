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
import { useRouter, useLocalSearchParams } from "expo-router";
import RazorpayCheckout from "react-native-razorpay";
import { getAddresses, createAddress, Address } from "../api/address";
import { getCart } from "../api/cart";
import { createPaymentOrder, verifyPaymentAndCreateOrder } from "../api/payment";

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ lat?: string; lng?: string }>();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);

  const [label, setLabel] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  const [pickedLat, setPickedLat] = useState<number | null>(null);
  const [pickedLng, setPickedLng] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      const [addressData, cartData] = await Promise.all([getAddresses(), getCart()]);
      setAddresses(addressData);
      if (addressData.length > 0) setSelectedId(addressData[0].id);
      else setShowForm(true);

      const total = cartData.reduce(
        (sum: number, item: any) => sum + item.product.price * item.quantity,
        0
      );
      setCartTotal(total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Pick up lat/lng passed back from the map picker screen
  useEffect(() => {
    if (params.lat && params.lng) {
      setPickedLat(parseFloat(params.lat));
      setPickedLng(parseFloat(params.lng));
      setShowForm(true); // ensure the form is visible so the user can finish saving
    }
  }, [params.lat, params.lng]);

  const handleSaveAddress = async () => {
    if (!label || !addressLine || !city || !state || !pincode) {
      Alert.alert("Error", "Please fill all address fields");
      return;
    }
    try {
      const newAddress = await createAddress({
        label,
        addressLine,
        city,
        state,
        pincode,
        lat: pickedLat ?? undefined,
        lng: pickedLng ?? undefined,
      });
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedId(newAddress.id);
      setShowForm(false);
      // reset form fields for next time
      setLabel("");
      setAddressLine("");
      setCity("");
      setState("");
      setPincode("");
      setPickedLat(null);
      setPickedLng(null);
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to save address");
    }
  };

  const handlePayAndPlaceOrder = async () => {
    if (!selectedId) {
      Alert.alert("Select an address", "Please choose or add a delivery address");
      return;
    }

    if (cartTotal <= 0) {
      Alert.alert("Error", "Your cart is empty");
      return;
    }

    setPlacing(true);
    try {
      // Step 1: Create Razorpay order via our backend
      const paymentOrder = await createPaymentOrder(cartTotal);

      // Step 2: Open Razorpay checkout UI
      const options = {
        description: "StyleAI Order Payment",
        currency: paymentOrder.currency,
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        order_id: paymentOrder.orderId,
        name: "StyleAI",
        prefill: {
          email: "",
          contact: "",
        },
        theme: { color: "#000000" },
      };

      const paymentResult = await RazorpayCheckout.open(options);

      // Step 3: Verify payment + create real order in our backend
      const order = await verifyPaymentAndCreateOrder({
        razorpay_order_id: paymentResult.razorpay_order_id,
        razorpay_payment_id: paymentResult.razorpay_payment_id,
        razorpay_signature: paymentResult.razorpay_signature,
        addressId: selectedId,
      });

      Alert.alert("Payment Successful!", "Your order has been placed", [
        { text: "OK", onPress: () => router.replace("/home") },
      ]);
    } catch (error: any) {
      if (error.code === 0 || error.description) {
        // User cancelled the Razorpay popup
        Alert.alert("Payment Cancelled", "You cancelled the payment");
      } else {
        Alert.alert("Error", error.response?.data?.message || "Payment failed");
      }
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
        <Text style={styles.addNewText}>{showForm ? "Cancel" : "+ Add New Address"}</Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.form}>
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => router.push("/map-picker")}
          >
            <Text style={styles.mapButtonText}>
              {pickedLat ? "📍 Location Selected" : "📍 Pick Location on Map"}
            </Text>
          </TouchableOpacity>

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

      <Text style={styles.totalText}>Total: ₹{cartTotal}</Text>

      <TouchableOpacity
        style={styles.placeOrderButton}
        onPress={handlePayAndPlaceOrder}
        disabled={placing}
      >
        {placing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>Pay & Place Order</Text>
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
  addressCard: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 14, marginBottom: 10 },
  addressCardSelected: { borderColor: "#000", backgroundColor: "#f5f5f5" },
  addressLabel: { fontWeight: "600" },
  addressText: { color: "#555", marginTop: 4, fontSize: 13 },
  addNewText: { color: "#007AFF", marginTop: 8, marginBottom: 16 },
  form: { marginBottom: 20 },
  mapButton: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  mapButtonText: { fontWeight: "600" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 12, marginBottom: 10 },
  saveButton: { backgroundColor: "#333", borderRadius: 8, padding: 14, alignItems: "center" },
  saveButtonText: { color: "#fff", fontWeight: "600" },
  totalText: { fontSize: 18, fontWeight: "bold", marginTop: 10, marginBottom: 10 },
  placeOrderButton: { backgroundColor: "#000", borderRadius: 8, padding: 16, alignItems: "center", marginBottom: 40 },
  placeOrderText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
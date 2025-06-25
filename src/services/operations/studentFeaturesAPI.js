import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";

const { COURSE_PAYMENT_API } = studentEndpoints;

// Helper to create and submit a form to PayU
function submitPayUForm(actionUrl, params) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  Object.keys(params).forEach((key) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = params[key];
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

export async function buyCourse(token, courses, userDetails, navigate, dispatch) {
  const toastId = toast.loading("Loading...");
  try {
    // Get PayU params from backend
    const orderResponse = await apiConnector(
      "POST",
      COURSE_PAYMENT_API,
      { courses },
      {
        Authorization: `Bearer ${token}`,
      }
    );

    if (!orderResponse.data.success) {
      throw new Error(orderResponse.data.message);
    }
    const payuParams = orderResponse.data.data;
    // Show PayU params in an alert for debugging
    alert("PayU Params:\n" + JSON.stringify(payuParams, null, 2));
    // Submit form to PayU
    submitPayUForm(payuParams.baseUrl || "https://secure.payu.in/_payment", payuParams);
  } catch (error) {
    console.log("PAYMENT API ERROR.....", error);
    toast.error("Could not make Payment");
  }
  toast.dismiss(toastId);
}
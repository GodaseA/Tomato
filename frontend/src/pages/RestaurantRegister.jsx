
// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { Store, ArrowLeft } from "lucide-react";
// import api from "../api/axios";

// const initialForm = {
//   name: "",
//   description: "",
//   email: "",
//   phone: "",
//   street: "",
//   city: "",
//   state: "",
//   postalCode: "",
// };

// export default function RestaurantRegister() {
//   const [form, setForm] = useState(initialForm);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleChange = (event) => {
//     setForm({ ...form, [event.target.name]: event.target.value });
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError("");
//     setLoading(true);

//     try {
//       await api.post("/owner/restaurant", {
//         name: form.name,
//         description: form.description,
//         email: form.email,
//         phone: form.phone,
//         address: {
//           street: form.street,
//           city: form.city,
//           state: form.state,
//           postalCode: form.postalCode,
//         },
//       });

//       navigate("/restaurant");
//     } catch (err) {
//       setError(
//         err.response?.data?.message ||
//           "Unable to submit your application."
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fieldClass =
//     "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";

//   return (
//     <main className="min-h-screen bg-slate-50 px-4 py-10">
//       <div className="mx-auto max-w-3xl">
//         <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-orange-600">
//           <ArrowLeft size={17} /> Back home
//         </Link>

//         <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
//           <div className="flex items-center gap-3">
//             <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
//               <Store size={28} />
//             </div>
//             <div>
//               <h1 className="text-2xl font-extrabold text-slate-900">
//                 Register your restaurant
//               </h1>
//               <p className="mt-1 text-sm text-slate-500">
//                 Submit your details for admin review.
//               </p>
//             </div>
//           </div>

//           <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
//             Your restaurant will remain pending until an admin approves it.
//           </div>

//           {error && (
//             <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
//               {error}
//             </p>
//           )}

//           <form onSubmit={handleSubmit} className="mt-7 space-y-5">
//             <div>
//               <label className="mb-2 block text-sm font-semibold">Restaurant name</label>
//               <input className={fieldClass} name="name" value={form.name} onChange={handleChange} minLength={2} maxLength={150} required />
//             </div>

//             <div>
//               <label className="mb-2 block text-sm font-semibold">Description</label>
//               <textarea className={fieldClass} name="description" value={form.description} onChange={handleChange} maxLength={1000} rows={3} />
//             </div>

//             <div className="grid gap-5 sm:grid-cols-2">
//               <div>
//                 <label className="mb-2 block text-sm font-semibold">Contact email</label>
//                 <input className={fieldClass} type="email" name="email" value={form.email} onChange={handleChange} />
//               </div>
//               <div>
//                 <label className="mb-2 block text-sm font-semibold">Phone</label>
//                 <input className={fieldClass} type="tel" name="phone" value={form.phone} onChange={handleChange} required minLength={7} maxLength={20} />
//               </div>
//               <div className="sm:col-span-2">
//                 <label className="mb-2 block text-sm font-semibold">Street address</label>
//                 <input className={fieldClass} name="street" value={form.street} onChange={handleChange} required maxLength={200} />
//               </div>
//               <div>
//                 <label className="mb-2 block text-sm font-semibold">City</label>
//                 <input className={fieldClass} name="city" value={form.city} onChange={handleChange} required maxLength={100} />
//               </div>
//               <div>
//                 <label className="mb-2 block text-sm font-semibold">State</label>
//                 <input className={fieldClass} name="state" value={form.state} onChange={handleChange} required maxLength={100} />
//               </div>
//               <div>
//                 <label className="mb-2 block text-sm font-semibold">Postal code</label>
//                 <input className={fieldClass} name="postalCode" value={form.postalCode} onChange={handleChange} required maxLength={12} />
//               </div>
//             </div>

//             <button disabled={loading} className="w-full rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-white hover:bg-orange-600 disabled:opacity-60">
//               {loading ? "Submitting..." : "Submit for approval"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </main>
//   );
// }

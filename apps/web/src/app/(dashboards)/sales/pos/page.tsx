"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Calendar,
	ChevronDown,
	ChevronUp,
	Edit3,
	IndianRupee,
	Info,
	Loader2,
	MapPin,
	Minus,
	PauseCircle,
	Percent,
	Plus,
	PlusCircle,
	Route,
	Search,
	ShoppingCart,
	Sparkles,
	Tag,
	Trash2,
	User,
	Wifi,
	WifiOff,
	X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import {
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { toast } from "sonner";
import { PaymentModal } from "@/components/pos/payment-modal";
import { SaleCompletionScreen } from "@/components/pos/SaleCompletionScreen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	AnimatedButton,
	AnimatedCard,
	PageTransition,
	StaggerItem,
	StaggerList,
} from "@/lib/animations";
import { offlineDb } from "@/lib/offline-db";
import { trpc } from "@/lib/trpc/client";

// Reusable Devanagari Parser to localize dynamic product content
export function getLocalizedProductName(name: string, locale: string): string {
	if (!name) return "";

	if (locale !== "hi") {
		// When viewing in English (or non-Hindi), strip out Hindi/Devanagari characters and empty parentheses
		// so that English product details and prices (e.g. "Rs 10") are cleanly visible without truncation.
		let res = name.replace(/\s*\([\s\u0900-\u097F]+\)\s*/g, " ");
		res = res.replace(/[\u0900-\u097F]+/g, "");
		res = res.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
		res = res.replace(/\(\s*\)/g, "");
		res = res.replace(/\s+/g, " ").replace(/\s*,/g, ",").trim();
		return res || name;
	}

	// Try extracting Hindi inside parentheses, e.g. "Mishri (मिश्री)"
	const match = name.match(/\(([^)]*[\u0900-\u097F][^)]*)\)/);
	if (match && match[1]) {
		return match[1].trim();
	}

	// Translation Dictionary Fallback for pre-seeded product datasets
	const productTranslations: Record<string, string> = {
		"Farari Spicy Namkeen": "फरार तीखा नमकीन",
		Sprite: "स्प्राइट",
		Maaza: "माज़ा",
		Mishri: "मिश्री",
		Revdi: "रेवड़ी",
		pepsi: "पेप्सी",
		"pepsi rs1": "पेप्सी ₹1",
		"Harish Chips": "हरीश चिप्स",
		"Balaji Oil": "बालाजी तेल",
		Appy: "एप्पी",
		"Swastik Toor Dal": "स्वस्तिक तूर दाल",
		"Ghadhi 1kg Sack": "घड़ी १ किलो बोरी",
		"Target Mango": "टारगेट आम",
		"moongfali kacche dane": "मूँगफली कच्चे दाने",
		"sikhe dane": "सीखे दाने",
	};

	for (const [eng, hin] of Object.entries(productTranslations)) {
		if (name.toLowerCase().includes(eng.toLowerCase())) {
			return hin;
		}
	}

	return name;
}

const DISCOUNT_PRESET_REASONS = [
	"Loyal Customer Discount (नियमित ग्राहक)",
	"Bulk Quantity Purchase (थोक खरीद छूट)",
	"Special Scheme / Festive Offer (विशेष स्कीम / ऑफर)",
	"Manager Approved Discount (मैनेजर अनुमति)",
	"Damaged / Defective Packaging (पैकेजिंग क्षति)",
	"Round-off / Price Adjustment (राउंड-ऑफ छूट)",
	"Custom / Other Reason",
];

const EXTRA_CHARGES_PRESET_REASONS = [
	"Delivery / Transport Charge (होम डिलीवरी / भाड़ा)",
	"Carton & Packaging Fee (पैकिंग एवं बॉक्स शुल्क)",
	"Loading & Unloading Handling (लोडिंग / अनलोडिंग शुल्क)",
	"Urgent / Night Dispatch (तत्काल डिस्पैच शुल्क)",
	"Cold Storage & Special Care (कोल्ड स्टोरेज शुल्क)",
	"Custom / Other Charge",
];

function ScrollableQtyInput({
	qty,
	unit,
	onChange,
	onIncrement,
	onDecrement,
	className = "",
}: {
	qty: number;
	unit?: string | null;
	onChange: (val: number) => void;
	onIncrement: () => void;
	onDecrement: () => void;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [textValue, setTextValue] = useState(String(qty));
	const [isEditing, setIsEditing] = useState(false);

	useEffect(() => {
		if (!isEditing) {
			setTextValue(String(qty));
		}
	}, [qty, isEditing]);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (e.deltaY < 0) {
				onIncrement();
			} else if (e.deltaY > 0) {
				onDecrement();
			}
		};

		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			el.removeEventListener("wheel", handleWheel);
		};
	}, [onIncrement, onDecrement]);

	const commit = () => {
		setIsEditing(false);
		const parsed = Number.parseFloat(textValue.trim());
		if (isNaN(parsed) || parsed <= 0) {
			onChange(0);
		} else {
			onChange(Math.round(parsed * 1000) / 1000);
		}
	};

	return (
		<div
			ref={ref}
			data-lenis-prevent
			title="Click to type number manually, or scroll mouse wheel to adjust (1, 2, 3...)"
			className={className}
			onClick={(e) => {
				e.stopPropagation();
				inputRef.current?.focus();
				inputRef.current?.select();
			}}
		>
			<span className="select-none text-[9px] opacity-50">↕</span>
			<input
				ref={inputRef}
				type="text"
				inputMode="decimal"
				value={textValue}
				onFocus={(e) => {
					setIsEditing(true);
					e.target.select();
				}}
				onChange={(e) => {
					const val = e.target.value;
					if (/^\d*\.?\d*$/.test(val)) {
						setTextValue(val);
					}
				}}
				onBlur={commit}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.currentTarget.blur();
					} else if (e.key === "ArrowUp") {
						e.preventDefault();
						onIncrement();
					} else if (e.key === "ArrowDown") {
						e.preventDefault();
						onDecrement();
					}
				}}
				onClick={(e) => e.stopPropagation()}
				className="w-9 min-w-0 cursor-text rounded border-none bg-transparent p-0 text-center font-bold font-mono text-emerald-950 text-xs outline-none focus:bg-white dark:text-emerald-100 dark:focus:bg-gray-900"
			/>
			{unit && unit !== "Pcs" && (
				<span className="shrink-0 select-none font-normal text-[10px] opacity-80">
					{unit}
				</span>
			)}
		</div>
	);
}

function WheelStepperWrapper({
	children,
	onIncrement,
	onDecrement,
	className = "",
}: {
	children: React.ReactNode;
	onIncrement: () => void;
	onDecrement: () => void;
	className?: string;
}) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const handleWheel = (e: WheelEvent) => {
			e.preventDefault();
			e.stopPropagation();
			if (e.deltaY < 0) {
				onIncrement();
			} else if (e.deltaY > 0) {
				onDecrement();
			}
		};

		el.addEventListener("wheel", handleWheel, { passive: false });
		return () => {
			el.removeEventListener("wheel", handleWheel);
		};
	}, [onIncrement, onDecrement]);

	return (
		<div
			ref={ref}
			data-lenis-prevent
			title="Scroll mouse wheel up/down to adjust quantity"
			className={className}
		>
			{children}
		</div>
	);
}

function POSContent() {
	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = trpc.useUtils();

	// State declarations
	const [cart, setCart] = useState<any[]>([]);
	const [search, setSearch] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [isOffline, setIsOffline] = useState(false);
	const [customerModalOpen, setCustomerModalOpen] = useState(true);
	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
	const [customerDetails, setCustomerDetails] = useState<{
		customerId?: number;
		customerName?: string;
		customerPhone?: string;
		shopName?: string;
		address?: string;
		routeId?: number;
		routeName?: string;
	}>({});
	const [lastPayments, setLastPayments] = useState<any[]>([]);
	const [activeMobileTab, setActiveMobileTab] = useState<"catalog" | "cart">(
		"catalog",
	);
	const [customBillDate, setCustomBillDate] = useState<string>(""); // YYYY-MM-DD backdate or empty for real time

	// Discount state
	const [discountAmount, setDiscountAmount] = useState<number>(0);
	const [discountType, setDiscountType] = useState<"fixed" | "percent">(
		"fixed",
	);
	const [discountReason, setDiscountReason] = useState<string>("");
	const [discountModalOpen, setDiscountModalOpen] = useState(false);

	// Temp state in Discount modal
	const [tempDiscountVal, setTempDiscountVal] = useState<string>("");
	const [tempDiscountType, setTempDiscountType] = useState<"fixed" | "percent">(
		"fixed",
	);
	const [tempDiscountReason, setTempDiscountReason] = useState<string>("");
	const [tempCustomDiscountReason, setTempCustomDiscountReason] =
		useState<string>("");

	// Extra charges state
	const [extraChargesAmount, setExtraChargesAmount] = useState<number>(0);
	const [extraChargesReason, setExtraChargesReason] = useState<string>("");
	const [extraChargesModalOpen, setExtraChargesModalOpen] = useState(false);

	// Temp state in Extra charges modal
	const [tempExtraVal, setTempExtraVal] = useState<string>("");
	const [tempExtraReason, setTempExtraReason] = useState<string>("");
	const [tempCustomExtraReason, setTempCustomExtraReason] =
		useState<string>("");
	const checkingOutRef = useRef(false);

	// Summary Breakdown Accordion toggle state (collapsed on mobile by default to maximize space for items)
	const [showSummaryDetails, setShowSummaryDetails] = useState<boolean>(() => {
		if (typeof window !== "undefined") {
			return window.innerWidth >= 768;
		}
		return true;
	});

	// Product Details Modal state
	const [detailsProduct, setDetailsProduct] = useState<any | null>(null);

	// URL Params
	const completedOrderIdParam = searchParams.get("completedOrderId");
	const completedOrderId = completedOrderIdParam
		? Number.parseInt(completedOrderIdParam, 10)
		: null;
	const resumeId = searchParams.get("resume");

	// Queries
	const { data: fetchedCompletedOrder } = trpc.orders.get.useQuery(
		{ id: completedOrderId ?? 0 },
		{ enabled: !!completedOrderId },
	);

	const { data: resumeOrder } = trpc.orders.get.useQuery(
		{ id: Number(resumeId) },
		{ enabled: !!resumeId },
	);

	const { data: catalog, isLoading } = trpc.pos.catalog.useQuery(undefined, {
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const [effectiveCatalog, setEffectiveCatalog] = useState<any[]>([]);

	useEffect(() => {
		if (catalog && catalog.length > 0) {
			setEffectiveCatalog(catalog);
			offlineDb.products
				.clear()
				.then(() => {
					offlineDb.products.bulkPut(catalog);
				})
				.catch((err) => console.warn("Failed to cache products:", err));
		} else {
			offlineDb.products
				.toArray()
				.then((offlineProducts) => {
					if (offlineProducts && offlineProducts.length > 0) {
						setEffectiveCatalog(offlineProducts);
					}
				})
				.catch((err) => console.warn("Failed to load offline products:", err));
		}
	}, [catalog]);

	const displayCatalog = useMemo(
		() => (effectiveCatalog.length > 0 ? effectiveCatalog : catalog || []),
		[effectiveCatalog, catalog],
	);

	// Mutations
	const deleteHoldBillMutation = trpc.orders.delete.useMutation();

	// Calculations
	const subtotal = useMemo(
		() =>
			cart.reduce(
				(acc, item) => acc + Number.parseFloat(item.price) * item.qty,
				0,
			),
		[cart],
	);

	const totalCartQuantity = useMemo(
		() => cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0),
		[cart],
	);

	const discountValue = useMemo(() => {
		if (!discountAmount || discountAmount <= 0) return 0;
		if (discountType === "percent") {
			return Math.min(subtotal, (subtotal * discountAmount) / 100);
		}
		return Math.min(subtotal, discountAmount);
	}, [subtotal, discountAmount, discountType]);

	const extraChargesValue = useMemo(() => {
		return Math.max(0, extraChargesAmount || 0);
	}, [extraChargesAmount]);

	const total = Math.max(0, subtotal - discountValue + extraChargesValue);

	// Translations Dictionary
	const t = {
		posTitle: locale === "hi" ? "बिक्री केंद्र (POS)" : "Point of Sale",
		online: locale === "hi" ? "ऑनलाइन" : "Online",
		offline: locale === "hi" ? "ऑफ़लाइन" : "Offline",
		searchPlaceholder:
			locale === "hi"
				? "उत्पाद कोड (#), नाम या बारकोड से तुरंत खोजें…"
				: "Search by fast product # code, name or barcode…",
		currentOrder: locale === "hi" ? "वर्तमान आदेश (Cart)" : "Current Order",
		clear: locale === "hi" ? "साफ़ करें" : "Clear",
		emptyCart: locale === "hi" ? "कार्ट खाली है" : "Cart is empty",
		scanHint:
			locale === "hi"
				? "एक बारकोड स्कैन करें या उत्पाद पर क्लिक करें"
				: "Scan a barcode or click a product",
		unitLabel: locale === "hi" ? "प्रति इकाई" : "/ unit",
		subtotal: locale === "hi" ? "उप-योग (Subtotal)" : "Subtotal",
		discount: locale === "hi" ? "छूट (Discount)" : "Discount",
		editDiscount: locale === "hi" ? "छूट जोड़ें / बदलें" : "Edit Discount",
		extraCharges:
			locale === "hi" ? "अतिरिक्त शुल्क (Extra Charges)" : "Extra Charges",
		addExtraCharges:
			locale === "hi" ? "+ अतिरिक्त शुल्क जोड़ें" : "+ Add Extra Charge",
		total: locale === "hi" ? "कुल राशि (Total)" : "Total",
		holdBill: locale === "hi" ? "बिल होल्ड करें" : "Hold Bill",
		holding: locale === "hi" ? "होल्ड हो रहा है..." : "Holding...",
		payNow: locale === "hi" ? "भुगतान करें" : "Pay Now",
		processing: locale === "hi" ? "प्रक्रिया में..." : "Processing...",
		successMsg:
			locale === "hi"
				? "ऑर्डर सफलतापूर्वक संसाधित किया गया!"
				: "Order processed successfully!",
		failMsg: locale === "hi" ? "चेकआउट विफल रहा:" : "Checkout failed:",
		close: locale === "hi" ? "बंद करें" : "Close",
	};

	const checkoutMutation = trpc.pos.checkout.useMutation({
		onSuccess: (data) => {
			checkingOutRef.current = false;
			toast.success(t.successMsg);
			setLastCompletedOrder({
				id: data.id,
				createdAt: customBillDate
					? new Date(`${customBillDate}T12:00:00`).toISOString()
					: new Date().toISOString(),
				items: cart,
				total: total,
				subtotal: subtotal,
				discount: discountValue,
				discountReason: discountReason || undefined,
				otherCharges: extraChargesValue,
				otherChargesReason: extraChargesReason || undefined,
				payments: lastPayments,
				finance_status:
					data.finance_status ||
					(lastPayments && lastPayments.length > 0 ? "paid" : "pending"),
				...customerDetails,
			});
			setCart([]);
			setDiscountAmount(0);
			setDiscountReason("");
			setExtraChargesAmount(0);
			setExtraChargesReason("");
			setCustomBillDate("");

			utils.orders.list.invalidate();
			utils.cashbook.getLedger.invalidate();
			utils.cashbook.getDailySummary.invalidate();

			if (resumeId) {
				window.history.replaceState({}, "", "/sales/pos");
			}
		},
		onError: (err) => {
			checkingOutRef.current = false;
			toast.error(`${t.failMsg}: ${err.message}`);
		},
	});

	const suspendMutation = trpc.pos.suspendCart.useMutation({
		onSuccess: () => {
			toast.success("Bill put on hold!");
			setCart([]);
			setDiscountAmount(0);
			setDiscountReason("");
			setExtraChargesAmount(0);
			setExtraChargesReason("");
			utils.orders.list.invalidate();
		},
		onError: (err) => {
			toast.error(`Hold bill failed: ${err.message}`);
		},
	});

	const consumedOrderRef = useRef<number | null>(null);

	// Effects
	useEffect(() => {
		if (
			fetchedCompletedOrder &&
			consumedOrderRef.current !== fetchedCompletedOrder.id
		) {
			consumedOrderRef.current = fetchedCompletedOrder.id;
			if (typeof window !== "undefined") {
				window.history.replaceState({}, "", "/sales/pos");
			}
			setLastCompletedOrder({
				id: fetchedCompletedOrder.id,
				createdAt: fetchedCompletedOrder.created_at
					? new Date(fetchedCompletedOrder.created_at).toISOString()
					: new Date().toISOString(),
				items:
					fetchedCompletedOrder.orderItems?.map((item: any) => ({
						id: item.id,
						name: item.product?.name || "Item",
						qty: Number(item.quantity) || 0,
						price: Number(item.price).toFixed(2),
					})) || [],
				total: Number(fetchedCompletedOrder.total_amount),
				subtotal: Number(fetchedCompletedOrder.total_amount),
				discount: Number(fetchedCompletedOrder.discount_amount || 0),
				discountReason: fetchedCompletedOrder.discount_reason || undefined,
				otherCharges: Number(fetchedCompletedOrder.other_charges || 0),
				otherChargesReason:
					fetchedCompletedOrder.other_charges_reason || undefined,
				cashierName: "Counter 1",
				customerName:
					fetchedCompletedOrder.customer?.name || "Walk-in Customer",
				customerPhone: fetchedCompletedOrder.customer?.phone || "",
				address: fetchedCompletedOrder.customer?.address || "",
				village: (fetchedCompletedOrder.customer as any)?.village || "",
				shopName: "",
				payments:
					fetchedCompletedOrder.finance_status === "pending" ||
					fetchedCompletedOrder.finance_status === "unpaid"
						? []
						: [
								{
									methodId: fetchedCompletedOrder.payment_method_id || 1,
									amount: Number(fetchedCompletedOrder.total_amount).toFixed(2),
								},
							],
				finance_status: fetchedCompletedOrder.finance_status || "pending",
			});
		}
	}, [fetchedCompletedOrder]);

	useEffect(() => {
		if (resumeOrder && resumeOrder.orderItems && cart.length === 0) {
			const restoredCart = resumeOrder.orderItems.map((item: any) => ({
				id: item.product?.id || item.product_id,
				name: item.product?.name || `Item #${item.product_id}`,
				price: Number(item.price) || 0,
				qty: Number(item.quantity) || 1,
			}));
			setCart(restoredCart);
			if (
				resumeOrder.discount_amount &&
				Number(resumeOrder.discount_amount) > 0
			) {
				setDiscountAmount(Number(resumeOrder.discount_amount));
				setDiscountType("fixed");
				setDiscountReason(resumeOrder.discount_reason || "");
			}
			if (resumeOrder.other_charges && Number(resumeOrder.other_charges) > 0) {
				setExtraChargesAmount(Number(resumeOrder.other_charges));
				setExtraChargesReason(resumeOrder.other_charges_reason || "");
			}
			if (typeof window !== "undefined") {
				window.history.replaceState({}, "", window.location.pathname);
			}
		}
	}, [resumeOrder, cart.length]);

	useEffect(() => {
		const handleOnline = () => setIsOffline(false);
		const handleOffline = () => setIsOffline(true);
		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);
		setIsOffline(!navigator.onLine);
		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Callbacks
	const addToCart = useCallback((product: any, qty = 1) => {
		const effectivePrice =
			product.hasDailyOffer && product.offerPrice
				? product.offerPrice
				: product.price;

		setCart((prev) => {
			const existing = prev.find((item) => item.id === product.id);
			if (existing) {
				const updatedItem = { ...existing, qty: existing.qty + qty };
				return [updatedItem, ...prev.filter((item) => item.id !== product.id)];
			}
			return [{ ...product, price: effectivePrice, qty: qty }, ...prev];
		});
	}, []);

	useEffect(() => {
		let barcode = "";
		let timeout: NodeJS.Timeout;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			if (e.key === "Enter") {
				if (barcode && catalog) {
					if (barcode.length === 13 && barcode.startsWith("21")) {
						const itemCode = barcode.substring(2, 7);
						const weightStr = barcode.substring(7, 12);
						const qty = Number.parseFloat(weightStr) / 1000;
						const product = catalog.find((p) => p.barcode === itemCode);
						if (product) {
							if (product.is_weighted) {
								addToCart(product, qty);
								toast.success(
									`Added ${getLocalizedProductName(product.name, locale)} (${qty.toFixed(3)}kg)`,
								);
							} else {
								addToCart(product, 1);
								toast.warning("Product is not weighted, added 1 unit");
							}
						} else {
							toast.error("Product not found");
						}
					} else if (barcode.length === 13 && barcode.startsWith("22")) {
						const itemCode = barcode.substring(2, 7);
						const priceStr = barcode.substring(7, 12);
						const price = Number.parseFloat(priceStr) / 100;
						const product = catalog.find((p) => p.barcode === itemCode);
						if (product) {
							if (product.is_weighted) {
								const qty = price / Number.parseFloat(product.price);
								addToCart(product, qty);
								toast.success(
									`Added ${getLocalizedProductName(product.name, locale)} (${qty.toFixed(3)}kg)`,
								);
							} else {
								addToCart(product, 1);
								toast.warning("Product is not weighted, added 1 unit");
							}
						} else {
							toast.error("Product not found");
						}
					} else {
						const product = catalog.find(
							(p) => p.barcode === barcode || p.sku === barcode,
						);
						if (product) {
							addToCart(product, 1);
							toast.success(
								`Added ${getLocalizedProductName(product.name, locale)}`,
							);
						} else {
							toast.error("Product not found");
						}
					}
				}
				barcode = "";
				return;
			}

			if (e.key.length === 1) {
				barcode += e.key;
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					barcode = "";
				}, 100);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [catalog, addToCart, locale]);

	const updateQty = (id: number, delta: number) => {
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					const newQty = Math.max(
						0.001,
						Number.parseFloat((item.qty + delta).toFixed(3)),
					);
					return { ...item, qty: newQty };
				}
				return item;
			}),
		);
	};

	const setDirectQty = (id: number, val: number) => {
		if (isNaN(val) || val <= 0) return;
		setCart((prev) =>
			prev.map((item) => {
				if (item.id === id) {
					return { ...item, qty: val };
				}
				return item;
			}),
		);
	};

	const removeFromCart = (id: number) => {
		setCart((prev) => prev.filter((item) => item.id !== id));
	};

	// Discount Dialog Handlers
	const openDiscountDialog = () => {
		setTempDiscountVal(discountAmount > 0 ? String(discountAmount) : "");
		setTempDiscountType(discountType);
		setTempDiscountReason(discountReason);
		setTempCustomDiscountReason(
			DISCOUNT_PRESET_REASONS.includes(discountReason) ? "" : discountReason,
		);
		setDiscountModalOpen(true);
	};

	const applyDiscount = () => {
		const parsedVal = Number.parseFloat(tempDiscountVal);
		if (isNaN(parsedVal) || parsedVal <= 0) {
			setDiscountAmount(0);
			setDiscountReason("");
			setDiscountModalOpen(false);
			toast.info(locale === "hi" ? "छूट हटा दी गई" : "Discount removed");
			return;
		}

		const finalReason =
			tempDiscountReason === "Custom / Other Reason" || !tempDiscountReason
				? tempCustomDiscountReason.trim() ||
					(locale === "hi" ? "विशेष छूट" : "Special Discount")
				: tempDiscountReason;

		setDiscountAmount(parsedVal);
		setDiscountType(tempDiscountType);
		setDiscountReason(finalReason);
		setDiscountModalOpen(false);
		toast.success(
			locale === "hi" ? "छूट सफलतापूर्वक लागू की गई!" : "Discount applied!",
		);
	};

	const clearDiscount = () => {
		setDiscountAmount(0);
		setDiscountReason("");
		setTempDiscountVal("");
		setTempDiscountReason("");
		setTempCustomDiscountReason("");
		setDiscountModalOpen(false);
		toast.info(locale === "hi" ? "छूट हटा दी गई" : "Discount removed");
	};

	// Extra Charges Dialog Handlers
	const openExtraChargesDialog = () => {
		setTempExtraVal(extraChargesAmount > 0 ? String(extraChargesAmount) : "");
		setTempExtraReason(extraChargesReason);
		setTempCustomExtraReason(
			EXTRA_CHARGES_PRESET_REASONS.includes(extraChargesReason)
				? ""
				: extraChargesReason,
		);
		setExtraChargesModalOpen(true);
	};

	const applyExtraCharges = () => {
		const parsedVal = Number.parseFloat(tempExtraVal);
		if (isNaN(parsedVal) || parsedVal <= 0) {
			setExtraChargesAmount(0);
			setExtraChargesReason("");
			setExtraChargesModalOpen(false);
			toast.info(
				locale === "hi" ? "अतिरिक्त शुल्क हटा दिया गया" : "Extra charges removed",
			);
			return;
		}

		const finalReason =
			tempExtraReason === "Custom / Other Charge" || !tempExtraReason
				? tempCustomExtraReason.trim() ||
					(locale === "hi" ? "अतिरिक्त शुल्क" : "Extra Charge")
				: tempExtraReason;

		setExtraChargesAmount(parsedVal);
		setExtraChargesReason(finalReason);
		setExtraChargesModalOpen(false);
		toast.success(
			locale === "hi" ? "अतिरिक्त शुल्क जोड़ा गया!" : "Extra charges added!",
		);
	};

	const clearExtraCharges = () => {
		setExtraChargesAmount(0);
		setExtraChargesReason("");
		setTempExtraVal("");
		setTempExtraReason("");
		setTempCustomExtraReason("");
		setExtraChargesModalOpen(false);
		toast.info(
			locale === "hi" ? "अतिरिक्त शुल्क हटा दिया गया" : "Extra charges removed",
		);
	};

	const handleCheckout = () => {
		if (cart.length === 0) return toast.error(t.emptyCart);
		setPaymentModalOpen(true);
	};

	const finalizeOrder = (
		payments: any[],
		customer?: {
			customerId?: number;
			customerName?: string;
			customerPhone?: string;
			shopName?: string;
			address?: string;
		},
	) => {
		if (checkingOutRef.current || checkoutMutation.isPending) return;

		if (customer) setCustomerDetails(customer);

		if (isOffline) {
			toast.info("Saved offline bill. Will sync when online.");
			setCart([]);
			setDiscountAmount(0);
			setDiscountReason("");
			setExtraChargesAmount(0);
			setExtraChargesReason("");
			return;
		}

		checkingOutRef.current = true;
		setLastPayments(payments);
		checkoutMutation.mutate({
			existingOrderId: resumeId ? Number(resumeId) : undefined,
			customerId: customer?.customerId,
			items: cart.map((c) => ({
				productId: c.id,
				quantity: c.qty,
				price: c.price,
			})),
			payments: payments,
			isOfflineSync: false,
			discountAmount: discountValue > 0 ? String(discountValue) : undefined,
			discountReason: discountReason || undefined,
			otherCharges:
				extraChargesValue > 0 ? String(extraChargesValue) : undefined,
			otherChargesReason: extraChargesReason || undefined,
			customBillDate: customBillDate || undefined,
		} as any);
	};

	const handleAddItemsFromHistory = useCallback(
		(items: any[]) => {
			if (!items || items.length === 0) return;
			let addedCount = 0;
			for (const item of items) {
				const matchedProduct = displayCatalog?.find(
					(p) => p.id === item.productId || p.id === item.id,
				);
				if (matchedProduct) {
					addToCart(matchedProduct, 1);
					addedCount++;
				} else {
					addToCart(
						{
							id: item.productId || item.id,
							name: item.name,
							price: item.price,
						},
						1,
					);
					addedCount++;
				}
			}
			if (addedCount > 0) {
				toast.success(
					locale === "hi"
						? `${addedCount} सामान कार्ट में जोड़े गए!`
						: `${addedCount} item(s) added to cart!`,
				);
			}
		},
		[displayCatalog, addToCart, locale],
	);

	const categories = useMemo(() => {
		if (!displayCatalog) return [];
		const cats = new Set<string>();
		for (const p of displayCatalog) {
			if (p.category && p.category.trim()) {
				cats.add(p.category.trim());
			}
		}
		return Array.from(cats).sort();
	}, [displayCatalog]);

	const filteredCatalog = useMemo(() => {
		if (!displayCatalog) return [];
		let result = displayCatalog;
		if (selectedCategory !== "all") {
			result = result.filter((p) => p.category === selectedCategory);
		}
		if (search.trim()) {
			const rawQ = search.trim();
			const q = rawQ.toLowerCase();
			const numericQ = rawQ.replace(/[^0-9]/g, "");

			result = result.filter((p) => {
				const localizedName = getLocalizedProductName(
					p.name || "",
					"hi",
				).toLowerCase();
				const nameLower = (p.name || "").toLowerCase();
				const descLower = (p.description || "").toLowerCase();
				const skuLower = (p.sku || "").toLowerCase();
				const barcodeLower = (p.barcode || "").toLowerCase();
				const catLower = (p.category || "").toLowerCase();
				const idStr = String(p.id);

				// Fast Number Code Match
				if (
					numericQ &&
					(idStr === numericQ || `#${idStr}` === q || `p-${idStr}` === q)
				) {
					return true;
				}

				// Check full text or localized Hindi match
				if (
					nameLower.includes(q) ||
					localizedName.includes(q) ||
					descLower.includes(q) ||
					skuLower.includes(q) ||
					barcodeLower.includes(q) ||
					catLower.includes(q)
				) {
					return true;
				}

				// Word token matching for space-separated search terms
				const searchTokens = q.split(/\s+/).filter(Boolean);
				if (searchTokens.length > 1) {
					const combinedHaystack = `${nameLower} ${localizedName} ${descLower} ${skuLower} ${barcodeLower} ${catLower}`;
					return searchTokens.every((token) =>
						combinedHaystack.includes(token),
					);
				}

				return false;
			});
		}
		return result;
	}, [catalog, search, selectedCategory]);

	if (lastCompletedOrder) {
		return (
			<SaleCompletionScreen
				order={lastCompletedOrder}
				onNewSale={() => {
					setLastCompletedOrder(null);
					if (typeof window !== "undefined") {
						window.history.replaceState({}, "", "/sales/pos");
					}
					router.replace("/sales/pos");
				}}
			/>
		);
	}

	return (
		<PageTransition className="flex h-[calc(100dvh-72px)] w-full flex-col overflow-hidden rounded-lg bg-muted/40 md:h-full md:flex-row">
			{/* Mobile View Mode Switcher */}
			<div className="flex shrink-0 items-center justify-between border-b bg-background p-2 md:hidden">
				<div className="flex w-full rounded-lg bg-muted p-1">
					<button
						type="button"
						onClick={() => setActiveMobileTab("catalog")}
						className={`flex-1 rounded-md py-1.5 font-semibold text-xs transition-all ${
							activeMobileTab === "catalog"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{t.posTitle}
					</button>
					<button
						type="button"
						onClick={() => setActiveMobileTab("cart")}
						className={`relative flex-1 rounded-md py-1.5 font-semibold text-xs transition-all ${
							activeMobileTab === "cart"
								? "bg-background text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground"
						}`}
					>
						{t.currentOrder} (
						{cart.reduce((acc, item) => acc + (item.qty || 1), 0)})
						{cart.length > 0 && (
							<span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-primary" />
						)}
					</button>
				</div>
			</div>

			{/* Left Pane - Catalog */}
			<div
				className={`min-h-0 flex-1 flex-col overflow-hidden border-r p-2.5 sm:p-4 ${
					activeMobileTab === "catalog" ? "flex" : "hidden md:flex"
				}`}
			>
				<div className="mb-3 flex shrink-0 items-center justify-between sm:mb-4">
					<div className="flex items-center gap-2">
						<h1 className="font-bold text-xl sm:text-2xl">{t.posTitle}</h1>
						{displayCatalog && displayCatalog.length > 0 && (
							<span className="rounded-md border bg-muted px-2 py-0.5 font-semibold text-muted-foreground text-xs">
								{displayCatalog.length} Products
							</span>
						)}
					</div>
					<div className="flex items-center gap-2">
						{/* Custom Bill Date Selector */}
						<div className="flex items-center gap-1">
							<div className="relative flex items-center">
								<Label htmlFor="pos-bill-date" className="sr-only">
									Bill Date
								</Label>
								<div
									className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-semibold text-xs transition-all ${
										customBillDate
											? "border-amber-500/60 bg-amber-50 text-amber-900 shadow-xs dark:bg-amber-950/50 dark:text-amber-300"
											: "border-border bg-background text-foreground hover:bg-muted/50"
									}`}
								>
									<Calendar
										className={`h-3.5 w-3.5 ${customBillDate ? "text-amber-600" : "text-muted-foreground"}`}
									/>
									<span className="hidden text-[11px] text-muted-foreground sm:inline">
										{locale === "hi" ? "बिल तारीख:" : "Bill Date:"}
									</span>
									<input
										id="pos-bill-date"
										type="date"
										value={customBillDate}
										onChange={(e) => setCustomBillDate(e.target.value)}
										className="w-[115px] min-w-0 cursor-pointer border-none bg-transparent p-0 font-bold text-foreground text-xs focus:outline-none sm:w-[125px] dark:text-slate-100"
									/>
									{customBillDate && (
										<button
											type="button"
											onClick={() => setCustomBillDate("")}
											className="ml-0.5 rounded-full p-0.5 font-extrabold text-amber-700 text-xs hover:bg-amber-200 hover:text-red-700"
											title={
												locale === "hi"
													? "वास्तविक समय (आज) पर रीसेट करें"
													: "Reset to Real-time (Today)"
											}
										>
											×
										</button>
									)}
								</div>
							</div>
						</div>

						{/* Customer / Route Action Button */}
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={() => setPaymentModalOpen(true)}
							className="h-8 gap-1.5 border-emerald-500/40 bg-emerald-50/60 font-semibold text-emerald-800 text-xs hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
						>
							<User className="h-3.5 w-3.5 text-emerald-600" />
							{customerDetails?.customerName ? (
								<span className="max-w-[140px] truncate font-bold">
									{customerDetails.customerName}
								</span>
							) : (
								<span>
									{locale === "hi" ? "ग्राहक / रूट चुनें" : "Customer / Route"}
								</span>
							)}
						</Button>

						{isOffline ? (
							<span className="flex items-center gap-1.5 font-semibold text-destructive text-xs sm:text-sm">
								<WifiOff className="h-4 w-4" /> {t.offline}
							</span>
						) : (
							<span className="flex items-center gap-1.5 font-semibold text-primary text-xs sm:text-sm">
								<Wifi className="h-4 w-4" /> {t.online}
							</span>
						)}
					</div>
				</div>

				{/* Search & Category Pills */}
				<div className="mb-3 flex shrink-0 flex-col gap-2 sm:mb-4">
					<div className="relative">
						<Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground sm:top-3" />
						<Input
							type="text"
							suppressHydrationWarning
							placeholder={t.searchPlaceholder}
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="h-9 bg-background pl-9 text-xs sm:h-10 sm:text-sm"
						/>
					</div>

					{/* Category Quick Filter Chips */}
					{categories.length > 0 && (
						<div className="scrollbar-thin flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
							<button
								type="button"
								onClick={() => setSelectedCategory("all")}
								className={`shrink-0 rounded-full px-2.5 py-1 font-medium transition-all ${
									selectedCategory === "all"
										? "bg-primary font-bold text-primary-foreground shadow-xs"
										: "bg-muted text-muted-foreground hover:bg-muted/80"
								}`}
							>
								All ({catalog?.length || 0})
							</button>
							{categories.map((c) => {
								const count =
									catalog?.filter((p) => p.category === c).length || 0;
								return (
									<button
										key={c}
										type="button"
										onClick={() => setSelectedCategory(c)}
										className={`shrink-0 rounded-full px-2.5 py-1 font-medium transition-all ${
											selectedCategory === c
												? "bg-primary font-bold text-primary-foreground shadow-xs"
												: "bg-muted text-muted-foreground hover:bg-muted/80"
										}`}
									>
										{c} ({count})
									</button>
								);
							})}
						</div>
					)}
				</div>

				<ScrollArea className="min-h-0 flex-1">
					{isLoading ? (
						<div className="grid grid-cols-2 gap-3 p-1 sm:gap-4 sm:p-2 md:grid-cols-3 lg:grid-cols-4">
							{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
								<div
									key={n}
									className="h-28 animate-pulse rounded-xl bg-muted sm:h-32"
								/>
							))}
						</div>
					) : filteredCatalog.length === 0 ? (
						<div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
							<Search className="mb-2 h-10 w-10 text-muted-foreground/30" />
							<p className="font-semibold text-sm">No products found</p>
							<p className="mt-1 text-xs">
								Try clearing your search query or switching to "All" categories.
							</p>
						</div>
					) : (
						<StaggerList className="grid grid-cols-2 gap-3 p-1 pb-20 sm:gap-4 sm:p-2 md:grid-cols-3 md:pb-2 lg:grid-cols-4">
							{filteredCatalog.map((product: any) => {
								const cartItem = cart.find((item) => item.id === product.id);
								const isInCart = Boolean(cartItem);
								const cartQty = cartItem ? cartItem.qty : 0;

								return (
									<StaggerItem key={product.id}>
										<AnimatedCard>
											<Card
												className={`group relative flex h-full cursor-pointer flex-col justify-between transition-all duration-200 ${
													isInCart
														? "border-emerald-500 bg-emerald-50/40 shadow-sm ring-2 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-950/20"
														: "border-transparent shadow-xs hover:border-primary/40 hover:shadow-sm"
												}`}
												onClick={() => {
													addToCart(product);
												}}
											>
												<CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
													<div className="flex items-center justify-between gap-1">
														<CardTitle
															className="flex-1 truncate font-semibold text-gray-900 text-xs sm:text-sm dark:text-gray-100"
															title={getLocalizedProductName(
																product.name,
																locale,
															)}
														>
															{getLocalizedProductName(product.name, locale)}
														</CardTitle>
														<div className="flex shrink-0 items-center gap-1">
															<span
																className={`shrink-0 rounded px-1.5 py-0.5 font-bold font-mono text-[10px] transition-colors ${
																	isInCart
																		? "bg-emerald-600 text-white"
																		: "bg-primary/10 text-primary dark:bg-primary/20"
																}`}
															>
																#{product.id}
															</span>
															{isInCart && (
																<button
																	type="button"
																	title={
																		locale === "hi"
																			? "हटाएं (Deselect / Remove)"
																			: "Deselect / Remove from cart"
																	}
																	onClick={(e) => {
																		e.stopPropagation();
																		removeFromCart(product.id);
																	}}
																	className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-2xs transition-colors hover:bg-rose-500 hover:text-white dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-600"
																>
																	<X className="h-3 w-3" />
																</button>
															)}
														</div>
													</div>
												</CardHeader>
												<CardContent className="flex flex-col justify-end p-3 pt-0 sm:p-4 sm:pt-0">
													{product.hasDailyOffer ? (
														<div className="space-y-0.5">
															<div className="flex items-center gap-1.5">
																<span className="font-semibold text-muted-foreground text-xs line-through sm:text-sm">
																	₹
																	{Number.parseFloat(
																		product.originalPrice || product.price,
																	).toFixed(2)}
																</span>
																<span className="font-extrabold text-base text-rose-600 sm:text-lg dark:text-rose-400">
																	₹
																	{Number.parseFloat(
																		product.offerPrice,
																	).toFixed(2)}
																</span>
															</div>
															<div className="flex items-center gap-1">
																<span className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 px-1.5 py-0.5 font-bold text-[10px] text-rose-600 dark:text-rose-400">
																	<Tag className="h-2.5 w-2.5" />
																	{product.dailyOfferPercent}% OFF
																</span>
																{product.dailyOfferReason && (
																	<span
																		className="truncate text-[10px] text-muted-foreground"
																		title={product.dailyOfferReason}
																	>
																		•{" "}
																		{product.dailyOfferReason
																			.split("(")[0]
																			.trim()}
																	</span>
																)}
															</div>
														</div>
													) : (
														<div className="font-bold text-base text-primary sm:text-lg">
															₹{Number.parseFloat(product.price).toFixed(2)}
														</div>
													)}
													<div className="mt-1 flex min-h-[18px] items-center justify-between gap-1">
														<span
															className="line-clamp-1 flex-1 text-[11px] text-muted-foreground sm:text-xs"
															title={product.description || product.name || ""}
														>
															{getLocalizedProductName(
																product.description || "",
																locale,
															)}
														</span>
														<button
															type="button"
															title={
																locale === "hi"
																	? "पूरा विवरण देखें (Full details)"
																	: "View full product description"
															}
															onClick={(e) => {
																e.stopPropagation();
																setDetailsProduct(product);
															}}
															className="flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted-foreground/70 transition-all hover:bg-primary/15 hover:text-primary active:scale-90"
														>
															<Info className="h-3 w-3" />
														</button>
													</div>

													{/* In-box Quantity Controller with Mouse Wheel Scroll & Deselect */}
													{isInCart ? (
														<div
															className="mt-2.5 flex items-center justify-between gap-1 rounded-lg border border-emerald-300 bg-white/95 p-1 shadow-xs dark:border-emerald-700/60 dark:bg-gray-800/95"
															onClick={(e) => e.stopPropagation()}
														>
															<button
																type="button"
																className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-700 transition-all hover:bg-rose-100 hover:text-rose-600 active:scale-95 dark:bg-gray-700 dark:text-gray-200"
																onClick={(e) => {
																	e.stopPropagation();
																	const nextQty = Math.ceil(cartQty) - 1;
																	if (nextQty <= 0) {
																		removeFromCart(product.id);
																	} else {
																		setDirectQty(product.id, nextQty);
																	}
																}}
																title={
																	locale === "hi"
																		? "कम करें (1 कम करें)"
																		: "Decrease by 1"
																}
															>
																<Minus className="h-3 w-3" />
															</button>

															<ScrollableQtyInput
																qty={cartQty}
																unit={product.unit}
																onChange={(val) => {
																	if (val <= 0) {
																		removeFromCart(product.id);
																	} else {
																		setDirectQty(product.id, val);
																	}
																}}
																onIncrement={() => {
																	// Pure integer scroll: 1, 2, 3, 4, 5, 6... (no decimals in scroll)
																	const nextQty = Math.floor(cartQty) + 1;
																	setDirectQty(product.id, nextQty);
																}}
																onDecrement={() => {
																	// Pure integer scroll: 5, 4, 3, 2, 1...
																	const nextQty = Math.ceil(cartQty) - 1;
																	if (nextQty <= 0) {
																		removeFromCart(product.id);
																	} else {
																		setDirectQty(product.id, nextQty);
																	}
																}}
																className="flex flex-1 cursor-ns-resize select-none items-center justify-center gap-0.5 rounded bg-emerald-600/10 px-1 py-0.5 text-center font-bold font-mono text-emerald-800 text-xs transition-all hover:bg-emerald-600/20 dark:text-emerald-200"
															/>

															<button
																type="button"
																className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-700 transition-all hover:bg-emerald-100 hover:text-emerald-600 active:scale-95 dark:bg-gray-700 dark:text-gray-200"
																onClick={(e) => {
																	e.stopPropagation();
																	const nextQty = Math.floor(cartQty) + 1;
																	setDirectQty(product.id, nextQty);
																}}
																title={
																	locale === "hi"
																		? "बढ़ाएं (1 बढ़ाएं)"
																		: "Increase by 1"
																}
															>
																<Plus className="h-3 w-3" />
															</button>
														</div>
													) : (
														<div className="mt-2.5 flex items-center justify-end">
															<span className="inline-flex items-center gap-1 rounded-md border border-gray-300 border-dashed bg-gray-50/50 px-2 py-0.5 font-semibold text-[11px] text-gray-500 transition-colors group-hover:border-primary group-hover:text-primary dark:border-gray-700 dark:bg-gray-800/40">
																<Plus className="h-2.5 w-2.5" />
																{locale === "hi" ? "जोड़ें" : "Add"}
															</span>
														</div>
													)}
												</CardContent>
											</Card>
										</AnimatedCard>
									</StaggerItem>
								);
							})}
						</StaggerList>
					)}
				</ScrollArea>

				{/* Permanent Mobile Action Bar (Catalog View) */}
				{activeMobileTab === "catalog" && (
					<div className="z-20 shrink-0 border-t bg-background/95 p-2.5 shadow-lg backdrop-blur-md md:hidden">
						<div className="flex items-center justify-between gap-2">
							{/* Cart total & item count preview with link to Cart tab */}
							<button
								type="button"
								onClick={() => setActiveMobileTab("cart")}
								className="group flex min-w-0 flex-1 cursor-pointer flex-col pl-1 text-left"
								title="View Cart"
							>
								<div className="flex items-center gap-1.5">
									<span className="font-extrabold text-base text-foreground">
										₹{total.toFixed(2)}
									</span>
									{cart.length > 0 && (
										<span className="rounded-full bg-blue-100 px-2 py-0.5 font-bold text-[10px] text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
											{totalCartQuantity} {locale === "hi" ? "पीस" : "pcs"}
										</span>
									)}
								</div>
								<span className="truncate text-[11px] text-muted-foreground transition-colors group-hover:text-primary">
									{cart.length === 0
										? locale === "hi"
											? "कार्ट खाली है"
											: "Cart is empty"
										: `${cart.length} ${cart.length === 1 ? (locale === "hi" ? "आइटम" : "item") : locale === "hi" ? "आइटम्स" : "items"} • ${locale === "hi" ? "ऑर्डर देखें" : "View Order"} →`}
								</span>
							</button>

							{/* Action Buttons: Hold Bill & Pay Now */}
							<div className="flex shrink-0 items-center gap-1.5">
								<Button
									variant="outline"
									size="sm"
									className="h-9 border-amber-300 bg-amber-50/60 px-2.5 font-semibold text-amber-900 text-xs hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
									onClick={() => {
										suspendMutation.mutate({
											items: cart,
											total: total.toString(),
											discountAmount:
												discountValue > 0 ? String(discountValue) : undefined,
											discountReason: discountReason || undefined,
											otherCharges:
												extraChargesValue > 0
													? String(extraChargesValue)
													: undefined,
											otherChargesReason: extraChargesReason || undefined,
										} as any);
									}}
									disabled={cart.length === 0 || suspendMutation.isPending}
								>
									<PauseCircle className="mr-1 h-3.5 w-3.5 text-amber-600" />
									{suspendMutation.isPending ? t.holding : t.holdBill}
								</Button>

								<Button
									size="sm"
									className="h-9 bg-primary px-3.5 font-bold text-primary-foreground text-xs shadow-xs hover:bg-primary/90"
									onClick={handleCheckout}
									disabled={cart.length === 0 || checkoutMutation.isPending}
								>
									<IndianRupee className="mr-1 h-3.5 w-3.5" />
									{checkoutMutation.isPending ? t.processing : t.payNow}
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Right Pane - Cart */}
			<div
				className={`z-10 min-h-0 w-full flex-1 flex-col overflow-hidden bg-background p-2.5 shadow-xl sm:p-4 md:h-full md:w-[350px] md:flex-initial lg:w-[400px] ${
					activeMobileTab === "cart" ? "flex" : "hidden md:flex"
				}`}
			>
				<div className="mb-3 flex shrink-0 items-center justify-between sm:mb-4">
					<div className="flex items-center gap-2">
						<h2 className="flex items-center gap-2 font-bold text-foreground text-lg sm:text-xl">
							<ShoppingCart className="h-5 w-5 text-primary" /> {t.currentOrder}
						</h2>
						{cart.length > 0 ? (
							<div className="fade-in zoom-in-95 flex animate-in items-center gap-1.5 duration-200">
								<span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-0.5 font-bold text-white text-xs shadow-xs">
									<Sparkles className="h-3 w-3 animate-pulse text-amber-300" />
									<span>
										{cart.length}{" "}
										{cart.length === 1
											? locale === "hi"
												? "उत्पाद"
												: "Product"
											: locale === "hi"
												? "उत्पाद"
												: "Products"}
									</span>
								</span>
								<span className="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-50/80 px-2 py-0.5 font-bold text-[11px] text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
									{totalCartQuantity} {locale === "hi" ? "कुल पीस" : "Qty"}
								</span>
							</div>
						) : (
							<span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
								0 {locale === "hi" ? "उत्पाद" : "Items"}
							</span>
						)}
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setCart([])}
						disabled={cart.length === 0 || checkoutMutation.isPending}
						className="text-muted-foreground text-xs hover:bg-destructive/10 hover:text-destructive"
					>
						{t.clear}
					</Button>
				</div>

				{/* Active Customer & Route Banner */}
				<div
					onClick={() => setCustomerModalOpen(true)}
					className="mb-2.5 flex cursor-pointer items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-50/80 p-2.5 text-xs transition-colors hover:bg-emerald-100/80 dark:border-emerald-800 dark:bg-emerald-950/50"
				>
					<div className="flex items-center gap-1.5 truncate">
						<User className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
						<span className="truncate font-bold text-emerald-900 dark:text-emerald-200">
							{customerDetails?.customerName ||
								(locale === "hi" ? "वाक-इन ग्राहक" : "Walk-in Customer")}
						</span>
						{customerDetails?.routeName && (
							<span className="flex shrink-0 items-center gap-1 rounded bg-emerald-200/60 px-1.5 py-0.5 font-semibold text-[10px] text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
								<Route className="h-3 w-3 text-emerald-600" />
								{customerDetails.routeName}
							</span>
						)}
					</div>
					<span className="ml-2 shrink-0 font-bold text-[10px] text-emerald-700 underline">
						{locale === "hi" ? "बदलें" : "Change"}
					</span>
				</div>

				{/* Dedicated Live Products Added Count Banner */}
				{cart.length > 0 && (
					<div className="fade-in slide-in-from-top-1 mb-2.5 flex animate-in items-center justify-between rounded-lg border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-blue-50/90 px-3 py-1.5 text-blue-950 text-xs shadow-xs duration-200 dark:border-blue-900/60 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-blue-950/40 dark:text-blue-200">
						<div className="flex items-center gap-1.5">
							<span className="relative flex h-2 w-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
								<span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
							</span>
							<span className="font-semibold text-blue-900 dark:text-blue-200">
								{locale === "hi" ? "कार्ट में जोड़े गए उत्पाद:" : "Products Added:"}
							</span>
							<span className="rounded-md bg-blue-600 px-1.5 py-0.5 font-black text-[11px] text-white shadow-xs">
								{cart.length}{" "}
								{cart.length === 1
									? locale === "hi"
										? "आइटम"
										: "Item"
									: locale === "hi"
										? "आइटम्स"
										: "Items"}
							</span>
						</div>
						<div className="flex items-center gap-1 font-semibold text-[11px] text-blue-800 dark:text-blue-300">
							<span>{locale === "hi" ? "कुल मात्रा:" : "Total Qty:"}</span>
							<span className="rounded bg-blue-200/70 px-2 py-0.5 font-black text-blue-950 dark:bg-blue-900/70 dark:text-blue-100">
								{totalCartQuantity} {locale === "hi" ? "पीस" : "Pcs"}
							</span>
						</div>
					</div>
				)}

				<ScrollArea className="scroll-area-vertical min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg bg-muted/20 p-2 sm:p-4">
					<AnimatePresence>
						{cart.length === 0 ? (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="flex h-full flex-col items-center justify-center space-y-4 text-muted-foreground"
							>
								<ShoppingCart className="h-16 w-16 opacity-20" />
								<p>{t.emptyCart}</p>
								<p className="text-xs">{t.scanHint}</p>
							</motion.div>
						) : (
							<div className="touch-pan-y space-y-2.5 pr-1.5 pb-4 sm:pr-4">
								{cart.map((item, index) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, scale: 0.95, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95, y: -10 }}
										className="group flex w-full flex-col gap-2 overflow-hidden rounded-lg border bg-card p-3 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
									>
										<div className="flex w-full min-w-0 items-center justify-between gap-2">
											<div className="flex min-w-0 flex-1 items-center gap-1.5">
												<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-[10px] text-primary dark:bg-primary/20">
													#{index + 1}
												</span>
												<div
													className="min-w-0 flex-1 truncate font-semibold text-foreground text-sm"
													title={getLocalizedProductName(item.name, locale)}
												>
													{getLocalizedProductName(item.name, locale)}
												</div>
											</div>
											<div className="shrink-0 whitespace-nowrap font-medium text-muted-foreground text-xs">
												₹{Number.parseFloat(item.price).toFixed(2)}{" "}
												{t.unitLabel}
											</div>
										</div>

										<div className="flex w-full min-w-0 items-center justify-between gap-2">
											<WheelStepperWrapper
												onIncrement={() => updateQty(item.id, 1)}
												onDecrement={() => updateQty(item.id, -1)}
												className="flex h-8 items-center rounded-md border bg-background"
											>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-none rounded-l-md hover:bg-muted"
													onClick={() => updateQty(item.id, -1)}
													disabled={checkoutMutation.isPending}
												>
													<Minus className="h-3 w-3" />
												</Button>
												<Input
													type="number"
													min={1}
													step="any"
													value={item.qty}
													onChange={(e) => {
														const val = Number.parseFloat(e.target.value);
														if (!isNaN(val) && val > 0) {
															setDirectQty(item.id, val);
														}
													}}
													className="h-8 w-14 cursor-ns-resize border-0 p-0 text-center font-bold text-sm [appearance:textfield] focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
													disabled={checkoutMutation.isPending}
													title="Scroll mouse wheel to adjust"
												/>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-none rounded-r-md hover:bg-muted"
													onClick={() => updateQty(item.id, 1)}
													disabled={checkoutMutation.isPending}
												>
													<Plus className="h-3 w-3" />
												</Button>
											</WheelStepperWrapper>
											<div className="flex items-center gap-3">
												<span className="font-extrabold text-foreground text-sm">
													₹
													{(Number.parseFloat(item.price) * item.qty).toFixed(
														2,
													)}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive hover:bg-destructive/10"
													onClick={() => removeFromCart(item.id)}
													disabled={checkoutMutation.isPending}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</div>
									</motion.div>
								))}
							</div>
						)}
					</AnimatePresence>
				</ScrollArea>

				{/* Cart Bottom Summary Block with Floating Border Toggle */}
				<div className="relative z-10 mt-auto shrink-0 border-t bg-background p-3 pt-3.5 shadow-lg sm:p-4 sm:shadow-none">
					{/* Circular Toggle Button positioned right on the top border line */}
					<button
						type="button"
						onClick={() => setShowSummaryDetails((prev) => !prev)}
						className="absolute -top-3.5 left-1/2 z-20 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-xs transition-all hover:bg-accent hover:text-foreground"
						title={showSummaryDetails ? "Hide breakdown" : "Show breakdown"}
					>
						{showSummaryDetails ? (
							<ChevronUp className="h-4 w-4 text-primary" />
						) : (
							<ChevronDown className="h-4 w-4 text-primary" />
						)}
					</button>

					{/* Expandable Summary Breakdown Rows */}
					<AnimatePresence initial={false}>
						{showSummaryDetails && (
							<motion.div
								initial={{ height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={{ height: 0, opacity: 0 }}
								transition={{ duration: 0.2 }}
								className="space-y-2.5 overflow-hidden pt-1"
							>
								{/* Subtotal row */}
								<div className="flex items-center justify-between text-muted-foreground text-sm">
									<span>{t.subtotal}</span>
									<span className="font-medium text-foreground">
										₹{subtotal.toFixed(2)}
									</span>
								</div>

								{/* Discount row */}
								<div className="flex items-center justify-between text-sm">
									<div className="flex flex-wrap items-center gap-1.5">
										<span className="text-muted-foreground">{t.discount}</span>
										{discountValue > 0 ? (
											<div className="flex items-center gap-1">
												<button
													type="button"
													onClick={openDiscountDialog}
													className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 text-xs transition-colors hover:bg-emerald-200"
													title={discountReason || "Discount reason"}
												>
													<span>
														{discountType === "percent"
															? `${discountAmount}%`
															: `₹${discountAmount}`}
													</span>
													{discountReason && (
														<span className="max-w-[100px] truncate opacity-80">
															({discountReason.split(" (")[0]})
														</span>
													)}
													<Edit3 className="ml-0.5 h-2.5 w-2.5" />
												</button>
												<button
													type="button"
													className="flex h-4 w-4 items-center justify-center rounded-full font-bold text-emerald-700 text-xs hover:bg-red-50 hover:text-red-600"
													onClick={clearDiscount}
													title="Remove discount"
												>
													×
												</button>
											</div>
										) : (
											<Button
												variant="outline"
												size="sm"
												className="h-6 gap-1 border-emerald-300 border-dashed px-2 text-emerald-700 text-xs hover:bg-emerald-50 hover:text-emerald-800"
												onClick={openDiscountDialog}
												disabled={cart.length === 0}
											>
												<Percent className="h-3 w-3" /> {t.editDiscount}
											</Button>
										)}
									</div>
									<span className="font-medium text-emerald-600">
										{discountValue > 0
											? `− ₹${discountValue.toFixed(2)}`
											: "− ₹0.00"}
									</span>
								</div>

								{/* Extra Charges row */}
								<div className="flex items-center justify-between text-sm">
									<div className="flex flex-wrap items-center gap-1.5">
										<span className="text-muted-foreground">
											{t.extraCharges}
										</span>
										{extraChargesValue > 0 ? (
											<div className="flex items-center gap-1">
												<button
													type="button"
													onClick={openExtraChargesDialog}
													className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 text-xs transition-colors hover:bg-blue-200"
													title={extraChargesReason || "Extra charge reason"}
												>
													<span>₹{extraChargesValue.toFixed(2)}</span>
													{extraChargesReason && (
														<span className="max-w-[100px] truncate opacity-80">
															({extraChargesReason.split(" (")[0]})
														</span>
													)}
													<Edit3 className="ml-0.5 h-2.5 w-2.5" />
												</button>
												<button
													type="button"
													className="flex h-4 w-4 items-center justify-center rounded-full font-bold text-blue-700 text-xs hover:bg-red-50 hover:text-red-600"
													onClick={clearExtraCharges}
													title="Remove extra charges"
												>
													×
												</button>
											</div>
										) : (
											<Button
												variant="outline"
												size="sm"
												className="h-6 gap-1 border-blue-300 border-dashed px-2 text-blue-700 text-xs hover:bg-blue-50 hover:text-blue-800"
												onClick={openExtraChargesDialog}
												disabled={cart.length === 0}
											>
												<PlusCircle className="h-3 w-3" /> {t.addExtraCharges}
											</Button>
										)}
									</div>
									<span className="font-medium text-blue-600">
										{extraChargesValue > 0
											? `+ ₹${extraChargesValue.toFixed(2)}`
											: "+ ₹0.00"}
									</span>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					{/* Total row */}
					<div className="flex items-baseline justify-between border-t pt-2">
						<div>
							<div className="font-extrabold text-foreground text-xl sm:text-2xl">
								{t.total}
							</div>
							{cart.length > 0 && (
								<p className="font-semibold text-[11px] text-blue-600 dark:text-blue-400">
									{cart.length}{" "}
									{cart.length === 1
										? locale === "hi"
											? "उत्पाद"
											: "product"
										: locale === "hi"
											? "उत्पाद"
											: "products"}{" "}
									• {totalCartQuantity} {locale === "hi" ? "कुल पीस" : "units"}
								</p>
							)}
						</div>
						<span className="font-black text-2xl text-foreground tracking-tight sm:text-3xl">
							₹{total.toFixed(2)}
						</span>
					</div>

					<div className="grid grid-cols-2 gap-2 pt-2">
						<Button
							variant="secondary"
							size="lg"
							className="w-full border border-amber-300/80 bg-amber-50 font-semibold text-amber-900 text-xs hover:bg-amber-100 sm:text-base dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
							onClick={() => {
								suspendMutation.mutate({
									items: cart,
									total: total.toString(),
									discountAmount:
										discountValue > 0 ? String(discountValue) : undefined,
									discountReason: discountReason || undefined,
									otherCharges:
										extraChargesValue > 0
											? String(extraChargesValue)
											: undefined,
									otherChargesReason: extraChargesReason || undefined,
								} as any);
							}}
							disabled={cart.length === 0 || suspendMutation.isPending}
						>
							<PauseCircle className="mr-1.5 h-4 w-4 shrink-0 text-amber-600" />
							{suspendMutation.isPending ? t.holding : t.holdBill}
						</Button>
						<Button
							size="lg"
							className="w-full bg-primary font-bold text-primary-foreground text-sm shadow-xs hover:bg-primary/90 sm:text-lg"
							onClick={handleCheckout}
							disabled={cart.length === 0 || checkoutMutation.isPending}
						>
							<IndianRupee className="mr-1.5 h-4 w-4 shrink-0" />
							{checkoutMutation.isPending ? t.processing : t.payNow}
						</Button>
					</div>
				</div>
			</div>

			{/* Initial Customer Selection Modal (Page Entry or Manual Trigger) */}
			{customerModalOpen && (
				<PaymentModal
					open={customerModalOpen}
					onOpenChange={setCustomerModalOpen}
					isInitialSelection={true}
					initialCustomerDetails={customerDetails}
					onConfirmCustomer={(cust: any) => {
						setCustomerDetails(cust);
						setCustomerModalOpen(false);
					}}
					onAddItemsToCart={handleAddItemsFromHistory}
				/>
			)}

			{/* Checkout Payment Modal */}
			{paymentModalOpen && (
				<PaymentModal
					open={paymentModalOpen}
					onOpenChange={setPaymentModalOpen}
					totalAmount={total}
					initialCustomerDetails={customerDetails}
					onConfirm={finalizeOrder}
					onAddItemsToCart={handleAddItemsFromHistory}
				/>
			)}

			{/* Discount Dialog Modal */}
			<Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<Percent className="h-5 w-5 text-emerald-600" />
							{locale === "hi"
								? "छूट एवं कारण (Discount & Reason)"
								: "Discount & Reason"}
						</DialogTitle>
						<DialogDescription>
							{locale === "hi"
								? "छूट राशि / प्रतिशत दर्ज करें और अधिकृत कारण का चयन करें।"
								: "Enter the discount value and specify the authorized reason."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Mode Toggle & Input */}
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">
								{locale === "hi"
									? "छूट का प्रकार एवं मान"
									: "Discount Type & Value"}
							</Label>
							<div className="flex gap-2">
								<div className="flex rounded-md border bg-muted p-0.5">
									<button
										type="button"
										onClick={() => setTempDiscountType("fixed")}
										className={`rounded px-3 py-1 font-semibold text-xs transition-all ${
											tempDiscountType === "fixed"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										₹ {locale === "hi" ? "राशि" : "Amount"}
									</button>
									<button
										type="button"
										onClick={() => setTempDiscountType("percent")}
										className={`rounded px-3 py-1 font-semibold text-xs transition-all ${
											tempDiscountType === "percent"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										% {locale === "hi" ? "प्रतिशत" : "Percent"}
									</button>
								</div>
								<div className="relative flex-1">
									<span className="absolute top-2.5 left-3 font-bold text-muted-foreground text-xs">
										{tempDiscountType === "fixed" ? "₹" : "%"}
									</span>
									<Input
										type="number"
										min="0"
										step="any"
										placeholder={tempDiscountType === "fixed" ? "0.00" : "0%"}
										value={tempDiscountVal}
										onChange={(e) => setTempDiscountVal(e.target.value)}
										className="pl-7 font-semibold"
										autoFocus
									/>
								</div>
							</div>
							{/* Live preview */}
							{tempDiscountVal && Number.parseFloat(tempDiscountVal) > 0 && (
								<div className="flex justify-between rounded-md bg-emerald-50 p-2 text-emerald-800 text-xs">
									<span>
										{locale === "hi" ? "लागू छूट:" : "Effective Discount:"}{" "}
										<strong>
											₹
											{(tempDiscountType === "percent"
												? Math.min(
														subtotal,
														(subtotal *
															Number.parseFloat(tempDiscountVal || "0")) /
															100,
													)
												: Math.min(
														subtotal,
														Number.parseFloat(tempDiscountVal || "0"),
													)
											).toFixed(2)}
										</strong>
									</span>
									<span>
										{locale === "hi" ? "नया योग:" : "New Total:"}{" "}
										<strong>
											₹
											{Math.max(
												0,
												subtotal -
													(tempDiscountType === "percent"
														? (subtotal *
																Number.parseFloat(tempDiscountVal || "0")) /
															100
														: Number.parseFloat(tempDiscountVal || "0")) +
													extraChargesValue,
											).toFixed(2)}
										</strong>
									</span>
								</div>
							)}
						</div>

						{/* Predefined Reasons Dropdown */}
						<div className="space-y-1.5">
							<Label
								htmlFor="discountReasonSelect"
								className="flex items-center justify-between font-semibold text-xs"
							>
								<span>
									{locale === "hi"
										? "छूट का कारण (Reason Dropdown)"
										: "Discount Reason Dropdown"}
								</span>
								{tempDiscountReason && (
									<span className="font-bold text-[10px] text-emerald-700">
										✓ {locale === "hi" ? "चयनित" : "Selected"}
									</span>
								)}
							</Label>
							<div className="relative">
								<select
									id="discountReasonSelect"
									value={tempDiscountReason}
									onChange={(e) => {
										const val = e.target.value;
										setTempDiscountReason(val);
										if (val !== "Custom / Other Reason") {
											setTempCustomDiscountReason("");
										}
									}}
									className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 pr-8 font-medium text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									<option value="">
										{locale === "hi"
											? "-- अधिकृत छूट कारण चुनें --"
											: "-- Select Authorized Discount Reason --"}
									</option>
									{DISCOUNT_PRESET_REASONS.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Custom Reason Text */}
						<div className="space-y-1">
							<Label className="text-muted-foreground text-xs">
								{locale === "hi"
									? "अतिरिक्त विवरण / टिप्पणी (वैकल्पिक)"
									: "Custom Note / Details (Optional)"}
							</Label>
							<Input
								type="text"
								placeholder={
									locale === "hi"
										? "जैसे: मैनेजर रोहन द्वारा स्वीकृत"
										: "e.g. Approved by Store Manager Rohan"
								}
								value={tempCustomDiscountReason}
								onChange={(e) => {
									setTempCustomDiscountReason(e.target.value);
									if (tempDiscountReason !== "Custom / Other Reason") {
										setTempDiscountReason("Custom / Other Reason");
									}
								}}
								className="text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						{discountAmount > 0 && (
							<Button
								variant="ghost"
								className="text-destructive hover:bg-destructive/10"
								onClick={clearDiscount}
							>
								{locale === "hi" ? "छूट हटाएं" : "Remove Discount"}
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => setDiscountModalOpen(false)}
						>
							{t.close}
						</Button>
						<Button
							className="bg-emerald-600 text-white hover:bg-emerald-700"
							onClick={applyDiscount}
						>
							{locale === "hi" ? "छूट लागू करें" : "Apply Discount"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Extra Charges Dialog Modal */}
			<Dialog
				open={extraChargesModalOpen}
				onOpenChange={setExtraChargesModalOpen}
			>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<PlusCircle className="h-5 w-5 text-blue-600" />
							{locale === "hi"
								? "अतिरिक्त शुल्क एवं कारण (Extra Charges)"
								: "Extra Charges & Reason"}
						</DialogTitle>
						<DialogDescription>
							{locale === "hi"
								? "डिलीवरी, पैकेजिंग या अन्य अतिरिक्त शुल्क और उसका कारण जोड़ें।"
								: "Add delivery, packaging, or handling charges with a specified reason."}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-2">
						{/* Extra Amount Input */}
						<div className="space-y-1.5">
							<Label className="font-semibold text-xs">
								{locale === "hi"
									? "अतिरिक्त शुल्क राशि (₹)"
									: "Extra Charge Amount (₹)"}
							</Label>
							<div className="relative">
								<span className="absolute top-2.5 left-3 font-bold text-muted-foreground text-xs">
									₹
								</span>
								<Input
									type="number"
									min="0"
									step="any"
									placeholder="0.00"
									value={tempExtraVal}
									onChange={(e) => setTempExtraVal(e.target.value)}
									className="pl-7 font-semibold"
									autoFocus
								/>
							</div>
							{/* Live preview */}
							{tempExtraVal && Number.parseFloat(tempExtraVal) > 0 && (
								<div className="flex justify-between rounded-md bg-blue-50 p-2 text-blue-800 text-xs">
									<span>
										{locale === "hi" ? "अतिरिक्त शुल्क:" : "Extra Charges:"}{" "}
										<strong>
											+₹{Number.parseFloat(tempExtraVal || "0").toFixed(2)}
										</strong>
									</span>
									<span>
										{locale === "hi" ? "नया योग:" : "New Total:"}{" "}
										<strong>
											₹
											{Math.max(
												0,
												subtotal -
													discountValue +
													Number.parseFloat(tempExtraVal || "0"),
											).toFixed(2)}
										</strong>
									</span>
								</div>
							)}
						</div>

						{/* Predefined Reasons Dropdown */}
						<div className="space-y-1.5">
							<Label
								htmlFor="extraChargesReasonSelect"
								className="flex items-center justify-between font-semibold text-xs"
							>
								<span>
									{locale === "hi"
										? "शुल्क का कारण (Category Dropdown)"
										: "Charge Category / Reason Dropdown"}
								</span>
								{tempExtraReason && (
									<span className="font-bold text-[10px] text-blue-700">
										✓ {locale === "hi" ? "चयनित" : "Selected"}
									</span>
								)}
							</Label>
							<div className="relative">
								<select
									id="extraChargesReasonSelect"
									value={tempExtraReason}
									onChange={(e) => {
										const val = e.target.value;
										setTempExtraReason(val);
										if (val !== "Custom / Other Charge") {
											setTempCustomExtraReason("");
										}
									}}
									className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 pr-8 font-medium text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
								>
									<option value="">
										{locale === "hi"
											? "-- अतिरिक्त शुल्क प्रकार चुनें --"
											: "-- Select Extra Charge Category --"}
									</option>
									{EXTRA_CHARGES_PRESET_REASONS.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</div>
						</div>

						{/* Custom Reason Text */}
						<div className="space-y-1">
							<Label className="text-muted-foreground text-xs">
								{locale === "hi"
									? "अतिरिक्त विवरण / टिप्पणी (वैकल्पिक)"
									: "Custom Note / Details (Optional)"}
							</Label>
							<Input
								type="text"
								placeholder={
									locale === "hi"
										? "जैसे: 5 किमी दूर विशेष डिलीवरी"
										: "e.g. 5km special express delivery"
								}
								value={tempCustomExtraReason}
								onChange={(e) => {
									setTempCustomExtraReason(e.target.value);
									if (tempExtraReason !== "Custom / Other Charge") {
										setTempExtraReason("Custom / Other Charge");
									}
								}}
								className="text-xs"
							/>
						</div>
					</div>

					<DialogFooter className="gap-2 sm:gap-0">
						{extraChargesAmount > 0 && (
							<Button
								variant="ghost"
								className="text-destructive hover:bg-destructive/10"
								onClick={clearExtraCharges}
							>
								{locale === "hi" ? "शुल्क हटाएं" : "Remove Charges"}
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => setExtraChargesModalOpen(false)}
						>
							{t.close}
						</Button>
						<Button
							className="bg-blue-600 text-white hover:bg-blue-700"
							onClick={applyExtraCharges}
						>
							{locale === "hi" ? "शुल्क जोड़ें" : "Apply Charges"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Product Details & Full Description Modal */}
			<Dialog
				open={!!detailsProduct}
				onOpenChange={(open) => {
					if (!open) setDetailsProduct(null);
				}}
			>
				<DialogContent className="max-w-md p-5 sm:max-w-lg">
					{detailsProduct && (
						<>
							<DialogHeader className="space-y-1.5 border-b pb-2">
								<div className="flex items-center justify-between gap-2">
									<span className="rounded bg-primary/10 px-2 py-0.5 font-bold font-mono text-primary text-xs dark:bg-primary/20">
										#{detailsProduct.id}
									</span>
									{detailsProduct.category && (
										<span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-muted-foreground text-xs">
											{detailsProduct.category}
										</span>
									)}
								</div>
								<DialogTitle className="font-bold text-base text-foreground sm:text-lg">
									{detailsProduct.name}
								</DialogTitle>
								<DialogDescription className="text-muted-foreground text-xs">
									{locale === "hi"
										? "उत्पाद का पूरा विवरण एवं मूल्य जानकारी"
										: "Complete product specifications, pricing, and description"}
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-2 text-sm">
								{/* Price & Offers Box */}
								<div className="space-y-2 rounded-xl border bg-muted/30 p-3.5">
									<div className="flex items-baseline justify-between">
										<span className="font-semibold text-muted-foreground text-xs">
											{locale === "hi"
												? "बिक्री मूल्य (Selling Price)"
												: "Selling Price"}
										</span>
										<div className="text-right">
											{detailsProduct.hasDailyOffer ? (
												<div className="flex items-baseline gap-2">
													<span className="font-semibold text-muted-foreground text-sm line-through">
														₹
														{Number.parseFloat(
															detailsProduct.originalPrice ||
																detailsProduct.price,
														).toFixed(2)}
													</span>
													<span className="font-extrabold text-rose-600 text-xl dark:text-rose-400">
														₹
														{Number.parseFloat(
															detailsProduct.offerPrice,
														).toFixed(2)}
													</span>
												</div>
											) : (
												<span className="font-extrabold text-primary text-xl">
													₹{Number.parseFloat(detailsProduct.price).toFixed(2)}
												</span>
											)}
											{detailsProduct.unit && (
												<span className="ml-1 text-muted-foreground text-xs">
													/ {detailsProduct.unit}
												</span>
											)}
										</div>
									</div>

									{detailsProduct.hasDailyOffer && (
										<div className="flex items-center gap-1.5 border-t border-dashed pt-1">
											<span className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 px-2 py-0.5 font-bold text-rose-600 text-xs dark:text-rose-400">
												<Tag className="h-3 w-3" />
												{detailsProduct.dailyOfferPercent}% OFF
											</span>
											{detailsProduct.dailyOfferReason && (
												<span className="text-muted-foreground text-xs">
													{detailsProduct.dailyOfferReason}
												</span>
											)}
										</div>
									)}
								</div>

								{/* Full Description Section */}
								<div className="space-y-1.5">
									<Label className="flex items-center gap-1.5 font-semibold text-foreground text-xs">
										<Info className="h-3.5 w-3.5 text-primary" />
										{locale === "hi"
											? "पूरा उत्पाद विवरण (Full Description)"
											: "Full Product Description"}
									</Label>
									<div className="max-h-[160px] min-h-[60px] overflow-y-auto whitespace-pre-wrap rounded-lg border bg-background p-3 text-foreground/90 text-xs leading-relaxed sm:text-sm">
										{detailsProduct.description || (
											<span className="text-muted-foreground italic">
												{locale === "hi"
													? "कोई अतिरिक्त विवरण उपलब्ध नहीं है।"
													: "No additional description provided."}
											</span>
										)}
									</div>
								</div>

								{/* Technical / Inventory Badges */}
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
										<span className="text-[11px] text-muted-foreground">
											{locale === "hi" ? "माप इकाई (Unit)" : "Measurement Unit"}
										</span>
										<p className="font-semibold text-foreground">
											{detailsProduct.unit || "Pcs"}{" "}
											{detailsProduct.is_weighted ? "(Weighted)" : ""}
										</p>
									</div>
									<div className="space-y-0.5 rounded-lg border bg-muted/20 p-2.5">
										<span className="text-[11px] text-muted-foreground">
											{locale === "hi" ? "बारकोड / एसकेयू" : "Barcode / SKU"}
										</span>
										<p className="truncate font-mono font-semibold text-foreground">
											{detailsProduct.barcode ||
												detailsProduct.sku ||
												`#${detailsProduct.id}`}
										</p>
									</div>
								</div>
							</div>

							<DialogFooter className="flex flex-row items-center justify-between gap-2 border-t pt-2 sm:gap-0">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setDetailsProduct(null)}
								>
									{locale === "hi" ? "बंद करें" : "Close"}
								</Button>

								{(() => {
									const inCartItem = cart.find(
										(i) => i.id === detailsProduct.id,
									);
									if (inCartItem) {
										return (
											<div className="flex items-center gap-2">
												<span className="font-bold text-emerald-700 text-xs dark:text-emerald-300">
													In Cart: {inCartItem.qty}{" "}
													{detailsProduct.unit || "Pcs"}
												</span>
												<Button
													size="sm"
													className="gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
													onClick={() => {
														addToCart(detailsProduct, 1);
														toast.success(
															`Added 1 more ${detailsProduct.name}`,
														);
													}}
												>
													<Plus className="h-3.5 w-3.5" />
													{locale === "hi" ? "+1 जोड़ें" : "Add +1"}
												</Button>
											</div>
										);
									}
									return (
										<Button
											size="sm"
											className="gap-1.5 bg-primary text-primary-foreground"
											onClick={() => {
												addToCart(detailsProduct, 1);
												toast.success(
													locale === "hi"
														? `${detailsProduct.name} कार्ट में जोड़ा गया!`
														: `Added ${detailsProduct.name} to cart!`,
												);
											}}
										>
											<Plus className="h-3.5 w-3.5" />
											{locale === "hi" ? "कार्ट में जोड़ें" : "Add to Cart"}
										</Button>
									);
								})()}
							</DialogFooter>
						</>
					)}
				</DialogContent>
			</Dialog>
		</PageTransition>
	);
}

export default function POSPage() {
	return (
		<Suspense
			fallback={
				<div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			}
		>
			<POSContent />
		</Suspense>
	);
}

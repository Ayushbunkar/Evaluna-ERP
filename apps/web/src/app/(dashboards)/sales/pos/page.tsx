"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
	Edit3,
	Minus,
	Percent,
	Plus,
	PlusCircle,
	Search,
	ShoppingCart,
	Sparkles,
	Tag,
	Trash2,
	Wifi,
	WifiOff,
	Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { trpc } from "@/lib/trpc/client";

// Reusable Devanagari Parser to localize dynamic product content
export function getLocalizedProductName(name: string, locale: string): string {
	if (!name) return "";
	if (locale !== "hi") {
		return name;
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

function POSContent() {
	const locale = useLocale();
	const router = useRouter();
	const searchParams = useSearchParams();
	const utils = trpc.useUtils();

	// State declarations
	const [cart, setCart] = useState<any[]>([]);
	const [search, setSearch] = useState("");
	const [isOffline, setIsOffline] = useState(false);
	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [lastCompletedOrder, setLastCompletedOrder] = useState<any>(null);
	const [customerDetails, setCustomerDetails] = useState<{
		customerName?: string;
		customerPhone?: string;
		shopName?: string;
	}>({});
	const [lastPayments, setLastPayments] = useState<any[]>([]);
	const [activeMobileTab, setActiveMobileTab] = useState<"catalog" | "cart">("catalog");

	// Discount state
	const [discountAmount, setDiscountAmount] = useState<number>(0);
	const [discountType, setDiscountType] = useState<"fixed" | "percent">("fixed");
	const [discountReason, setDiscountReason] = useState<string>("");
	const [discountModalOpen, setDiscountModalOpen] = useState(false);

	// Temp state in Discount modal
	const [tempDiscountVal, setTempDiscountVal] = useState<string>("");
	const [tempDiscountType, setTempDiscountType] = useState<"fixed" | "percent">("fixed");
	const [tempDiscountReason, setTempDiscountReason] = useState<string>("");
	const [tempCustomDiscountReason, setTempCustomDiscountReason] = useState<string>("");

	// Extra charges state
	const [extraChargesAmount, setExtraChargesAmount] = useState<number>(0);
	const [extraChargesReason, setExtraChargesReason] = useState<string>("");
	const [extraChargesModalOpen, setExtraChargesModalOpen] = useState(false);

	// Temp state in Extra charges modal
	const [tempExtraVal, setTempExtraVal] = useState<string>("");
	const [tempExtraReason, setTempExtraReason] = useState<string>("");
	const [tempCustomExtraReason, setTempCustomExtraReason] = useState<string>("");

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
		staleTime: 1000 * 60 * 60,
	});

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
				? "नाम से उत्पाद खोजें या बारकोड स्कैन करें..."
				: "Search products by name or scan barcode...",
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
		extraCharges: locale === "hi" ? "अतिरिक्त शुल्क (Extra Charges)" : "Extra Charges",
		addExtraCharges: locale === "hi" ? "+ अतिरिक्त शुल्क जोड़ें" : "+ Add Extra Charge",
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
			toast.success(t.successMsg);
			setLastCompletedOrder({
				id: data.id,
				createdAt: new Date().toISOString(),
				items: cart,
				total: total,
				subtotal: subtotal,
				discount: discountValue,
				discountReason: discountReason || undefined,
				otherCharges: extraChargesValue,
				otherChargesReason: extraChargesReason || undefined,
				payments: lastPayments,
				...customerDetails,
			});
			setCart([]);
			setDiscountAmount(0);
			setDiscountReason("");
			setExtraChargesAmount(0);
			setExtraChargesReason("");

			utils.orders.list.invalidate();
			utils.cashbook.getLedger.invalidate();
			utils.cashbook.getDailySummary.invalidate();

			if (resumeId) {
				deleteHoldBillMutation.mutate({ id: Number(resumeId) });
			}
		},
		onError: (err) => {
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
						qty: item.quantity,
						price: Number(item.price).toFixed(2),
					})) || [],
				total: Number(fetchedCompletedOrder.total_amount),
				subtotal: Number(fetchedCompletedOrder.total_amount),
				discount: Number(fetchedCompletedOrder.discount_amount || 0),
				discountReason: fetchedCompletedOrder.discount_reason || undefined,
				otherCharges: Number(fetchedCompletedOrder.other_charges || 0),
				otherChargesReason: fetchedCompletedOrder.other_charges_reason || undefined,
				cashierName: "Counter 1",
				customerName:
					fetchedCompletedOrder.customer?.name || "Walk-in Customer",
				customerPhone: fetchedCompletedOrder.customer?.phone || "",
				shopName: "",
				payments: [
					{
						methodId: fetchedCompletedOrder.payment_method_id || 1,
						amount: Number(fetchedCompletedOrder.total_amount).toFixed(2),
					},
				],
			});
		}
	}, [fetchedCompletedOrder]);

	useEffect(() => {
		if (resumeOrder && resumeOrder.orderItems && cart.length === 0) {
			const restoredCart = resumeOrder.orderItems.map((item: any) => ({
				id: item.product?.id || item.product_id,
				name: item.product?.name || `Item #${item.product_id}`,
				price: item.price,
				qty: item.quantity,
			}));
			setCart(restoredCart);
			if (resumeOrder.discount_amount && Number(resumeOrder.discount_amount) > 0) {
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
		const effectivePrice = product.hasDailyOffer && product.offerPrice
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
					const newQty = Math.max(0.001, item.qty + delta);
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
		const parsedVal = parseFloat(tempDiscountVal);
		if (isNaN(parsedVal) || parsedVal <= 0) {
			setDiscountAmount(0);
			setDiscountReason("");
			setDiscountModalOpen(false);
			toast.info(locale === "hi" ? "छूट हटा दी गई" : "Discount removed");
			return;
		}

		const finalReason =
			tempDiscountReason === "Custom / Other Reason" || !tempDiscountReason
				? tempCustomDiscountReason.trim() || (locale === "hi" ? "विशेष छूट" : "Special Discount")
				: tempDiscountReason;

		setDiscountAmount(parsedVal);
		setDiscountType(tempDiscountType);
		setDiscountReason(finalReason);
		setDiscountModalOpen(false);
		toast.success(locale === "hi" ? "छूट सफलतापूर्वक लागू की गई!" : "Discount applied!");
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
			EXTRA_CHARGES_PRESET_REASONS.includes(extraChargesReason) ? "" : extraChargesReason,
		);
		setExtraChargesModalOpen(true);
	};

	const applyExtraCharges = () => {
		const parsedVal = parseFloat(tempExtraVal);
		if (isNaN(parsedVal) || parsedVal <= 0) {
			setExtraChargesAmount(0);
			setExtraChargesReason("");
			setExtraChargesModalOpen(false);
			toast.info(locale === "hi" ? "अतिरिक्त शुल्क हटा दिया गया" : "Extra charges removed");
			return;
		}

		const finalReason =
			tempExtraReason === "Custom / Other Charge" || !tempExtraReason
				? tempCustomExtraReason.trim() || (locale === "hi" ? "अतिरिक्त शुल्क" : "Extra Charge")
				: tempExtraReason;

		setExtraChargesAmount(parsedVal);
		setExtraChargesReason(finalReason);
		setExtraChargesModalOpen(false);
		toast.success(locale === "hi" ? "अतिरिक्त शुल्क जोड़ा गया!" : "Extra charges added!");
	};

	const clearExtraCharges = () => {
		setExtraChargesAmount(0);
		setExtraChargesReason("");
		setTempExtraVal("");
		setTempExtraReason("");
		setTempCustomExtraReason("");
		setExtraChargesModalOpen(false);
		toast.info(locale === "hi" ? "अतिरिक्त शुल्क हटा दिया गया" : "Extra charges removed");
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

		setLastPayments(payments);
		checkoutMutation.mutate({
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
			otherCharges: extraChargesValue > 0 ? String(extraChargesValue) : undefined,
			otherChargesReason: extraChargesReason || undefined,
		} as any);
	};

	const filteredCatalog = catalog?.filter(
		(p) =>
			p.name.toLowerCase().includes(search.toLowerCase()) ||
			p.barcode?.includes(search),
	);

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
		<PageTransition className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-muted/40 md:flex-row">
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
						{t.currentOrder} ({cart.reduce((acc, item) => acc + (item.qty || 1), 0)})
						{cart.length > 0 && (
							<span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-primary" />
						)}
					</button>
				</div>
			</div>

			{/* Left Pane - Catalog */}
			<div
				className={`min-h-0 flex-1 flex-col border-r p-3 sm:p-4 ${
					activeMobileTab === "catalog" ? "flex" : "hidden md:flex"
				}`}
			>
				<div className="mb-3 flex shrink-0 items-center justify-between sm:mb-4">
					<h1 className="font-bold text-xl sm:text-2xl">{t.posTitle}</h1>
					<div className="flex items-center gap-2">
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

				<div className="relative mb-3 shrink-0 sm:mb-4">
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

				<ScrollArea className="min-h-0 flex-1">
					{isLoading ? (
						<div className="grid grid-cols-2 gap-3 p-1 sm:gap-4 sm:p-2 md:grid-cols-3 lg:grid-cols-4">
							{[1, 2, 3, 4, 5, 6].map((n) => (
								<div
									key={n}
									className="h-28 animate-pulse rounded-xl bg-muted sm:h-32"
								/>
							))}
						</div>
					) : (
						<StaggerList className="grid grid-cols-2 gap-3 p-1 sm:gap-4 sm:p-2 md:grid-cols-3 lg:grid-cols-4">
							{filteredCatalog?.map((product) => (
								<StaggerItem key={product.id}>
									<AnimatedCard>
										<Card
											className="flex h-full cursor-pointer flex-col justify-between border-transparent shadow-sm transition-colors hover:border-primary/50"
											onClick={() => {
												addToCart(product);
												toast.success(`Added ${getLocalizedProductName(product.name, locale)}`);
											}}
										>
											<CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
												<CardTitle
													className="truncate font-semibold text-xs sm:text-sm"
													title={getLocalizedProductName(product.name, locale)}
												>
													{getLocalizedProductName(product.name, locale)}
												</CardTitle>
											</CardHeader>
											<CardContent className="flex flex-col justify-end p-3 pt-0 sm:p-4 sm:pt-0">
												{product.hasDailyOffer ? (
													<div className="space-y-0.5">
														<div className="flex items-center gap-1.5">
															<span className="font-semibold text-muted-foreground line-through text-xs sm:text-sm">
																₹{Number.parseFloat(product.originalPrice || product.price).toFixed(2)}
															</span>
															<span className="font-extrabold text-base text-rose-600 dark:text-rose-400 sm:text-lg">
																₹{Number.parseFloat(product.offerPrice).toFixed(2)}
															</span>
														</div>
														<div className="flex items-center gap-1">
															<span className="inline-flex items-center gap-0.5 rounded bg-rose-500/15 px-1.5 py-0.5 font-bold text-[10px] text-rose-600 dark:text-rose-400">
																<Tag className="h-2.5 w-2.5" />
																{product.dailyOfferPercent}% OFF
															</span>
															{product.dailyOfferReason && (
																<span className="truncate text-[10px] text-muted-foreground" title={product.dailyOfferReason}>
																	• {product.dailyOfferReason.split("(")[0].trim()}
																</span>
															)}
														</div>
													</div>
												) : (
													<div className="font-bold text-base text-primary sm:text-lg">
														₹{Number.parseFloat(product.price).toFixed(2)}
													</div>
												)}
												<div className="mt-1 line-clamp-2 min-h-[28px] text-muted-foreground text-[11px] sm:min-h-[32px] sm:text-xs">
													{getLocalizedProductName(
														product.description || "",
														locale,
													)}
												</div>
											</CardContent>
										</Card>
									</AnimatedCard>
								</StaggerItem>
							))}
						</StaggerList>
					)}
				</ScrollArea>
			</div>

			{/* Right Pane - Cart */}
			<div
				className={`z-10 min-h-0 w-full shrink-0 flex-col bg-background p-3 shadow-xl sm:p-4 md:w-[350px] lg:w-[400px] ${
					activeMobileTab === "cart" ? "flex" : "hidden md:flex"
				}`}
			>
				<div className="mb-3 flex shrink-0 items-center justify-between sm:mb-4">
					<h2 className="flex items-center gap-2 font-bold text-lg sm:text-xl">
						<ShoppingCart className="h-5 w-5" /> {t.currentOrder}
					</h2>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setCart([])}
						disabled={cart.length === 0 || checkoutMutation.isPending}
					>
						{t.clear}
					</Button>
				</div>
				<ScrollArea className="scroll-area-vertical min-h-0 flex-1 bg-muted/20 p-4">
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
							<div className="space-y-3 pr-4">
								{cart.map((item) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, scale: 0.95, y: 10 }}
										animate={{ opacity: 1, scale: 1, y: 0 }}
										exit={{ opacity: 0, scale: 0.95, y: -10 }}
										className="flex w-full flex-col gap-2 overflow-hidden rounded-lg border bg-card p-3 shadow-sm"
									>
										<div className="flex w-full min-w-0 items-center justify-between gap-2">
											<div
												className="min-w-0 flex-1 truncate font-semibold text-sm"
												title={getLocalizedProductName(item.name, locale)}
											>
												{getLocalizedProductName(item.name, locale)}
											</div>
											<div className="shrink-0 whitespace-nowrap text-muted-foreground text-xs">
												₹{Number.parseFloat(item.price).toFixed(2)}{" "}
												{t.unitLabel}
											</div>
										</div>

										<div className="flex w-full min-w-0 items-center justify-between gap-2">
											<div className="flex h-8 items-center rounded-md border">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-none rounded-l-md"
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
														const val = parseFloat(e.target.value);
														if (!isNaN(val) && val > 0) {
															setDirectQty(item.id, val);
														}
													}}
													className="h-8 w-14 border-0 p-0 text-center font-semibold text-sm focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
													disabled={checkoutMutation.isPending}
												/>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 rounded-none rounded-r-md"
													onClick={() => updateQty(item.id, 1)}
													disabled={checkoutMutation.isPending}
												>
													<Plus className="h-3 w-3" />
												</Button>
											</div>
											<div className="flex items-center gap-3">
												<span className="font-bold text-sm">
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

				<div className="mt-4 shrink-0 space-y-2.5 border-t p-4 pt-3">
					{/* Subtotal row */}
					<div className="flex items-center justify-between text-muted-foreground text-sm">
						<span>{t.subtotal}</span>
						<span className="font-medium text-foreground">₹{subtotal.toFixed(2)}</span>
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
										className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 text-xs hover:bg-emerald-200 transition-colors"
										title={discountReason || "Discount reason"}
									>
										<span>{discountType === "percent" ? `${discountAmount}%` : `₹${discountAmount}`}</span>
										{discountReason && (
											<span className="max-w-[100px] truncate opacity-80">
												({discountReason.split(" (")[0]})
											</span>
										)}
										<Edit3 className="h-2.5 w-2.5 ml-0.5" />
									</button>
									<button
										type="button"
										className="h-4 w-4 rounded-full flex items-center justify-center text-emerald-700 hover:text-red-600 hover:bg-red-50 text-xs font-bold"
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
									className="h-6 gap-1 px-2 text-xs border-dashed text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 border-emerald-300"
									onClick={openDiscountDialog}
									disabled={cart.length === 0}
								>
									<Percent className="h-3 w-3" /> {t.editDiscount}
								</Button>
							)}
						</div>
						<span className="font-medium text-emerald-600">
							{discountValue > 0 ? `− ₹${discountValue.toFixed(2)}` : "− ₹0.00"}
						</span>
					</div>

					{/* Extra Charges row */}
					<div className="flex items-center justify-between text-sm">
						<div className="flex flex-wrap items-center gap-1.5">
							<span className="text-muted-foreground">{t.extraCharges}</span>
							{extraChargesValue > 0 ? (
								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={openExtraChargesDialog}
										className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800 text-xs hover:bg-blue-200 transition-colors"
										title={extraChargesReason || "Extra charge reason"}
									>
										<span>₹{extraChargesValue.toFixed(2)}</span>
										{extraChargesReason && (
											<span className="max-w-[100px] truncate opacity-80">
												({extraChargesReason.split(" (")[0]})
											</span>
										)}
										<Edit3 className="h-2.5 w-2.5 ml-0.5" />
									</button>
									<button
										type="button"
										className="h-4 w-4 rounded-full flex items-center justify-center text-blue-700 hover:text-red-600 hover:bg-red-50 text-xs font-bold"
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
									className="h-6 gap-1 px-2 text-xs border-dashed text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-300"
									onClick={openExtraChargesDialog}
									disabled={cart.length === 0}
								>
									<PlusCircle className="h-3 w-3" /> {t.addExtraCharges}
								</Button>
							)}
						</div>
						<span className="font-medium text-blue-600">
							{extraChargesValue > 0 ? `+ ₹${extraChargesValue.toFixed(2)}` : "+ ₹0.00"}
						</span>
					</div>

					{/* Total row */}
					<div className="flex items-center justify-between border-t pt-2 font-bold text-2xl">
						<span>{t.total}</span>
						<span>₹{total.toFixed(2)}</span>
					</div>

					<div className="grid grid-cols-2 gap-2 pt-2">
						<Button
							variant="secondary"
							size="lg"
							className="w-full"
							onClick={() => {
								suspendMutation.mutate({
									items: cart,
									total: total.toString(),
									discountAmount: discountValue > 0 ? String(discountValue) : undefined,
									discountReason: discountReason || undefined,
									otherCharges: extraChargesValue > 0 ? String(extraChargesValue) : undefined,
									otherChargesReason: extraChargesReason || undefined,
								} as any);
							}}
							disabled={cart.length === 0 || suspendMutation.isPending}
						>
							{suspendMutation.isPending ? t.holding : t.holdBill}
						</Button>
						<Button
							size="lg"
							className="w-full font-bold text-lg"
							onClick={handleCheckout}
							disabled={cart.length === 0 || checkoutMutation.isPending}
						>
							{checkoutMutation.isPending ? t.processing : t.payNow}
						</Button>
					</div>
				</div>
			</div>

			{/* Payment Modal */}
			{paymentModalOpen && (
				<PaymentModal
					open={paymentModalOpen}
					onOpenChange={setPaymentModalOpen}
					totalAmount={total}
					onConfirm={finalizeOrder}
				/>
			)}

			{/* Discount Dialog Modal */}
			<Dialog open={discountModalOpen} onOpenChange={setDiscountModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<Percent className="h-5 w-5 text-emerald-600" />
							{locale === "hi" ? "छूट एवं कारण (Discount & Reason)" : "Discount & Reason"}
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
							<Label className="text-xs font-semibold">
								{locale === "hi" ? "छूट का प्रकार एवं मान" : "Discount Type & Value"}
							</Label>
							<div className="flex gap-2">
								<div className="flex rounded-md border p-0.5 bg-muted">
									<button
										type="button"
										onClick={() => setTempDiscountType("fixed")}
										className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
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
										className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
											tempDiscountType === "percent"
												? "bg-background text-foreground shadow-sm"
												: "text-muted-foreground hover:text-foreground"
										}`}
									>
										% {locale === "hi" ? "प्रतिशत" : "Percent"}
									</button>
								</div>
								<div className="relative flex-1">
									<span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">
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
							{tempDiscountVal && parseFloat(tempDiscountVal) > 0 && (
								<div className="rounded-md bg-emerald-50 p-2 text-xs text-emerald-800 flex justify-between">
									<span>
										{locale === "hi" ? "लागू छूट:" : "Effective Discount:"}{" "}
										<strong>
											₹
											{(tempDiscountType === "percent"
												? Math.min(subtotal, (subtotal * parseFloat(tempDiscountVal || "0")) / 100)
												: Math.min(subtotal, parseFloat(tempDiscountVal || "0"))
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
														? (subtotal * parseFloat(tempDiscountVal || "0")) / 100
														: parseFloat(tempDiscountVal || "0")) +
													extraChargesValue,
											).toFixed(2)}
										</strong>
									</span>
								</div>
							)}
						</div>

						{/* Predefined Reasons */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">
								{locale === "hi" ? "छूट का कारण (Reason)" : "Discount Reason"}
							</Label>
							<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 max-h-44 overflow-y-auto pr-1">
								{DISCOUNT_PRESET_REASONS.map((r) => (
									<button
										key={r}
										type="button"
										onClick={() => {
											setTempDiscountReason(r);
											if (r !== "Custom / Other Reason") {
												setTempCustomDiscountReason("");
											}
										}}
										className={`text-left text-xs p-2 rounded-md border transition-all ${
											tempDiscountReason === r
												? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-900"
												: "border-border hover:bg-muted/50 text-foreground"
										}`}
									>
										{r}
									</button>
								))}
							</div>
						</div>

						{/* Custom Reason Text */}
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{locale === "hi" ? "अतिरिक्त विवरण / टिप्पणी (वैकल्पिक)" : "Custom Note / Details (Optional)"}
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
							<Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={clearDiscount}>
								{locale === "hi" ? "छूट हटाएं" : "Remove Discount"}
							</Button>
						)}
						<Button variant="outline" onClick={() => setDiscountModalOpen(false)}>
							{t.close}
						</Button>
						<Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={applyDiscount}>
							{locale === "hi" ? "छूट लागू करें" : "Apply Discount"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Extra Charges Dialog Modal */}
			<Dialog open={extraChargesModalOpen} onOpenChange={setExtraChargesModalOpen}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-lg">
							<PlusCircle className="h-5 w-5 text-blue-600" />
							{locale === "hi" ? "अतिरिक्त शुल्क एवं कारण (Extra Charges)" : "Extra Charges & Reason"}
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
							<Label className="text-xs font-semibold">
								{locale === "hi" ? "अतिरिक्त शुल्क राशि (₹)" : "Extra Charge Amount (₹)"}
							</Label>
							<div className="relative">
								<span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">
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
							{tempExtraVal && parseFloat(tempExtraVal) > 0 && (
								<div className="rounded-md bg-blue-50 p-2 text-xs text-blue-800 flex justify-between">
									<span>
										{locale === "hi" ? "अतिरिक्त शुल्क:" : "Extra Charges:"}{" "}
										<strong>+₹{parseFloat(tempExtraVal || "0").toFixed(2)}</strong>
									</span>
									<span>
										{locale === "hi" ? "नया योग:" : "New Total:"}{" "}
										<strong>
											₹
											{Math.max(
												0,
												subtotal - discountValue + parseFloat(tempExtraVal || "0"),
											).toFixed(2)}
										</strong>
									</span>
								</div>
							)}
						</div>

						{/* Predefined Reasons */}
						<div className="space-y-1.5">
							<Label className="text-xs font-semibold">
								{locale === "hi" ? "शुल्क का कारण (Category / Reason)" : "Charge Category / Reason"}
							</Label>
							<div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 max-h-44 overflow-y-auto pr-1">
								{EXTRA_CHARGES_PRESET_REASONS.map((r) => (
									<button
										key={r}
										type="button"
										onClick={() => {
											setTempExtraReason(r);
											if (r !== "Custom / Other Charge") {
												setTempCustomExtraReason("");
											}
										}}
										className={`text-left text-xs p-2 rounded-md border transition-all ${
											tempExtraReason === r
												? "border-blue-500 bg-blue-50 font-semibold text-blue-900"
												: "border-border hover:bg-muted/50 text-foreground"
										}`}
									>
										{r}
									</button>
								))}
							</div>
						</div>

						{/* Custom Reason Text */}
						<div className="space-y-1">
							<Label className="text-xs text-muted-foreground">
								{locale === "hi" ? "अतिरिक्त विवरण / टिप्पणी (वैकल्पिक)" : "Custom Note / Details (Optional)"}
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
							<Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={clearExtraCharges}>
								{locale === "hi" ? "शुल्क हटाएं" : "Remove Charges"}
							</Button>
						)}
						<Button variant="outline" onClick={() => setExtraChargesModalOpen(false)}>
							{t.close}
						</Button>
						<Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={applyExtraCharges}>
							{locale === "hi" ? "शुल्क जोड़ें" : "Apply Charges"}
						</Button>
					</DialogFooter>
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

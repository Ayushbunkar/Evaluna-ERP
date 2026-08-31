"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Input } from "@evaluna/ui/components/input";
import { Label } from "@evaluna/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@evaluna/ui/components/select";
import { Textarea } from "@evaluna/ui/components/textarea";
import { AlertCircleIcon, Loader2Icon } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

/**
 * One form dialog for every admin entity.
 *
 * Validation runs twice on purpose: cheaply here so the admin gets immediate,
 * field-level feedback, and authoritatively on the server — whose zod errors are
 * fed back in through `serverFieldErrors` and rendered against the same fields.
 */

export type FieldOption = { value: string; label: string };

export type FormField = {
	name: string;
	label: string;
	kind:
		| "text"
		| "email"
		| "tel"
		| "number"
		| "date"
		| "textarea"
		| "select"
		| "checkbox";
	required?: boolean;
	placeholder?: string;
	help?: string;
	options?: FieldOption[];
	min?: number;
	max?: number;
	step?: number;
	maxLength?: number;
	/** Regex the value must satisfy when non-empty. */
	pattern?: RegExp;
	patternMessage?: string;
	/** Full width in the two-column grid. */
	wide?: boolean;
	/** Rendered but not editable (e.g. a system-assigned code). */
	readOnly?: boolean;
};

export type FormValues = Record<string, string | boolean>;

function validate(fields: FormField[], values: FormValues) {
	const errors: Record<string, string> = {};
	for (const field of fields) {
		if (field.readOnly) continue;
		const raw = values[field.name];

		if (field.kind === "checkbox") continue;

		const value = typeof raw === "string" ? raw.trim() : "";
		if (field.required && value.length === 0) {
			errors[field.name] = `${field.label} is required.`;
			continue;
		}
		if (value.length === 0) continue;

		if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
			errors[field.name] = "Enter a valid email address.";
			continue;
		}
		if (field.kind === "tel" && !/^[0-9+\-\s()]{7,20}$/.test(value)) {
			errors[field.name] = "Enter a valid phone number.";
			continue;
		}
		if (field.kind === "number") {
			const n = Number(value);
			if (!Number.isFinite(n)) {
				errors[field.name] = `${field.label} must be a number.`;
				continue;
			}
			if (field.min !== undefined && n < field.min) {
				errors[field.name] = `${field.label} cannot be less than ${field.min}.`;
				continue;
			}
			if (field.max !== undefined && n > field.max) {
				errors[field.name] = `${field.label} cannot be more than ${field.max}.`;
				continue;
			}
		}
		if (field.kind === "date" && Number.isNaN(new Date(value).getTime())) {
			errors[field.name] = "Enter a valid date.";
			continue;
		}
		if (field.pattern && !field.pattern.test(value)) {
			errors[field.name] =
				field.patternMessage ?? `${field.label} is not in the expected format.`;
		}
	}
	return errors;
}

export function EntityFormDialog({
	open,
	onOpenChange,
	title,
	description,
	fields,
	initialValues,
	submitLabel = "Save",
	pending = false,
	serverError,
	serverFieldErrors,
	onSubmit,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	fields: FormField[];
	initialValues?: FormValues;
	submitLabel?: string;
	pending?: boolean;
	serverError?: string | null;
	serverFieldErrors?: Record<string, string>;
	onSubmit: (values: FormValues) => void;
}) {
	const formId = useId();
	const [values, setValues] = useState<FormValues>({});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState(false);

	// Re-seed whenever the dialog opens so an edit never shows the previous row.
	useEffect(() => {
		if (!open) return;
		const seeded: FormValues = {};
		for (const field of fields) {
			const provided = initialValues?.[field.name];
			if (field.kind === "checkbox") {
				seeded[field.name] = Boolean(provided);
			} else {
				seeded[field.name] =
					provided === undefined || provided === null ? "" : String(provided);
			}
		}
		setValues(seeded);
		setErrors({});
		setTouched(false);
		// initialValues is intentionally excluded: re-seeding on every parent
		// render would discard the admin's keystrokes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const merged = useMemo(
		() => ({ ...errors, ...(serverFieldErrors ?? {}) }),
		[errors, serverFieldErrors],
	);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (pending) return;
		const found = validate(fields, values);
		setErrors(found);
		setTouched(true);
		if (Object.keys(found).length > 0) {
			const first = document.querySelector<HTMLElement>(
				`[data-form="${formId}"] [aria-invalid="true"]`,
			);
			first?.focus();
			return;
		}
		onSubmit(values);
	};

	const setValue = (name: string, value: string | boolean) => {
		setValues((prev) => ({ ...prev, [name]: value }));
		if (touched) {
			setErrors((prev) => {
				const next = { ...prev };
				delete next[name];
				return next;
			});
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (pending) return;
				onOpenChange(next);
			}}
		>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>

				{serverError && (
					<div
						role="alert"
						className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-xs"
					>
						<AlertCircleIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
						<span>{serverError}</span>
					</div>
				)}

				<form onSubmit={handleSubmit} data-form={formId} noValidate>
					<div className="grid gap-4 sm:grid-cols-2">
						{fields.map((field) => {
							const error = merged[field.name];
							const inputId = `${formId}-${field.name}`;
							const errorId = `${inputId}-error`;
							const helpId = `${inputId}-help`;
							const describedBy =
								[error ? errorId : null, field.help ? helpId : null]
									.filter(Boolean)
									.join(" ") || undefined;

							if (field.kind === "checkbox") {
								return (
									<div
										key={field.name}
										className={`flex items-start gap-2 ${field.wide ? "sm:col-span-2" : ""}`}
									>
										<input
											id={inputId}
											type="checkbox"
											className="mt-1 h-4 w-4 rounded border-input"
											checked={Boolean(values[field.name])}
											disabled={pending || field.readOnly}
											onChange={(e) => setValue(field.name, e.target.checked)}
											aria-describedby={describedBy}
										/>
										<div className="space-y-0.5">
											<Label htmlFor={inputId} className="cursor-pointer">
												{field.label}
											</Label>
											{field.help && (
												<p id={helpId} className="text-muted-foreground text-xs">
													{field.help}
												</p>
											)}
										</div>
									</div>
								);
							}

							return (
								<div
									key={field.name}
									className={`space-y-1.5 ${field.wide ? "sm:col-span-2" : ""}`}
								>
									<Label htmlFor={inputId}>
										{field.label}
										{field.required && (
											<span className="ml-0.5 text-destructive" aria-hidden="true">
												*
											</span>
										)}
										{field.required && <span className="sr-only"> (required)</span>}
									</Label>

									{field.kind === "select" ? (
										<Select
											value={String(values[field.name] ?? "")}
											onValueChange={(v) => setValue(field.name, v)}
											disabled={pending || field.readOnly}
										>
											<SelectTrigger
												id={inputId}
												aria-invalid={Boolean(error)}
												aria-describedby={describedBy}
											>
												<SelectValue placeholder={field.placeholder ?? "Select…"} />
											</SelectTrigger>
											<SelectContent>
												{(field.options ?? []).map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									) : field.kind === "textarea" ? (
										<Textarea
											id={inputId}
											value={String(values[field.name] ?? "")}
											placeholder={field.placeholder}
											maxLength={field.maxLength}
											disabled={pending || field.readOnly}
											aria-invalid={Boolean(error)}
											aria-describedby={describedBy}
											onChange={(e) => setValue(field.name, e.target.value)}
											rows={3}
										/>
									) : (
										<Input
											id={inputId}
											type={
												field.kind === "number"
													? "number"
													: field.kind === "date"
														? "date"
														: field.kind === "email"
															? "email"
															: field.kind === "tel"
																? "tel"
																: "text"
											}
											value={String(values[field.name] ?? "")}
											placeholder={field.placeholder}
											min={field.min}
											max={field.max}
											step={field.step}
											maxLength={field.maxLength}
											readOnly={field.readOnly}
											disabled={pending || field.readOnly}
											aria-invalid={Boolean(error)}
											aria-describedby={describedBy}
											onChange={(e) => setValue(field.name, e.target.value)}
										/>
									)}

									{error ? (
										<p id={errorId} role="alert" className="text-destructive text-xs">
											{error}
										</p>
									) : field.help ? (
										<p id={helpId} className="text-muted-foreground text-xs">
											{field.help}
										</p>
									) : null}
								</div>
							);
						})}
					</div>

					<DialogFooter className="mt-6 gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={pending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={pending}>
							{pending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
							{pending ? "Saving…" : submitLabel}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

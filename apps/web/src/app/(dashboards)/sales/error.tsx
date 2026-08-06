"use client";
export default function Error({ error }: { error: Error }) {
	return (
		<div className="p-6 text-red-500">
			<h2 className="text-xl font-bold mb-2">An error occurred</h2>
			<pre className="text-sm whitespace-pre-wrap font-mono bg-red-50 p-4 rounded">{error.message}</pre>
			{error.stack && <pre className="text-xs whitespace-pre-wrap font-mono mt-2">{error.stack}</pre>}
		</div>
	);
}

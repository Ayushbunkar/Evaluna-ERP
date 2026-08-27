"use client";
export default function Error({ error }: { error: Error }) {
	return (
		<div className="p-6 text-red-500">
			<h2 className="mb-2 font-bold text-xl">An error occurred</h2>
			<pre className="whitespace-pre-wrap rounded bg-red-50 p-4 font-mono text-sm">
				{error.message}
			</pre>
			{error.stack && (
				<pre className="mt-2 whitespace-pre-wrap font-mono text-xs">
					{error.stack}
				</pre>
			)}
		</div>
	);
}






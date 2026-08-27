import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex-shrink-0 px-6 py-4">
            <Link href="/" className="flex items-center space-x-3">
              <span className="h-8 w-8 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 0c1.1 0 2 .9 2 2-.001.682-.268 1.285-.732 1.64l-7 7c-.254.254-.566.39-.9.39s-.646-.136-.9-.39l-3-3c-.254-.254-.254-.667 0-.92s.667-.254.92 0L9 11l7-7c.464-.454 1.09-.484 1.716-.01l.008.01c.35.285.547.742.547 1.233v.01z"></path>
                </svg>
              </span>
              <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                Evaluna Admin
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="mt-10 flex-1">
            <ul className="space-y-1 px-3">
              <Link
                href="/admin/dashboard"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 001 1h3m-3 2H9a2 2 0 00-2 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 00-2-2H9m-3 5v-6"></path>
                </svg>
                <span className="ml-3">Dashboard</span>
              </Link>

              <Link
                href="/admin/employees"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <span className="ml-3">Employees</span>
              </Link>

              <Link
                href="/admin/suppliers"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 0c1.1 0 2 .9 2 2-.001.682-.268 1.285-.732 1.64l-7 7c-.254.254-.566.39-.9.39s-.646-.136-.9-.39l-3-3c-.254-.254-.254-.667 0-.92s.667-.254.92 0L9 11l7-7c.464-.454 1.09-.484 1.716-.01l.008.01c.35.285.547.742.547 1.233v.01z"></path>
                </svg>
                <span className="ml-3">Suppliers</span>
              </Link>

              <Link
                href="/admin/customers"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857"></path>
                </svg>
                <span className="ml-3">Customers</span>
              </Link>

              <Link
                href="/admin/companies"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2m0 0c1.1 0 2 .9 2 2-.001.682-.268 1.285-.732 1.64l-7 7c-.254.254-.566.39-.9.39s-.646-.136-.9-.39l-3-3c-.254-.254-.254-.667 0-.92s.667-.254.92 0L9 11l7-7c.464-.454 1.09-.484 1.716-.01l.008.01c.35.285.547.742.547 1.233v.01z"></path>
                </svg>
                <span className="ml-3">Companies</span>
              </Link>

              <Link
                href="/admin/branches"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l8-4 8 4v10a2 2 0 01-2 2h-6a2 2 0 01-2-2v-2zm0 0L8 0l8 4v10a2 2 0 01-2 2h-6a2 2 0 01-2-2v-2z"></path>
                </svg>
                <span className="ml-3">Branches</span>
              </Link>

              <Link
                href="/admin/finance"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
                <span className="ml-3">Finance</span>
              </Link>

              <Link
                href="/admin/settings"
                className="flex w-full items-center px-3 py-3 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
              >
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573-1.066c-1.756-.426-2.924-.426-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543-.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-.426-1.756-.426-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.94-1.543 2.37.826 3.31.826 1.543.94-.826 2.37-.826 3.31-.826a1.724 1.724 0 002.573-1.066 1.724 1.724 0 001.066-2.573z"></path>
                </svg>
                <span className="ml-3">Settings</span>
              </Link>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Welcome, Administrator
              </div>
              <div className="flex items-center space-x-4">
                <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Profile</span>
                </button>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}





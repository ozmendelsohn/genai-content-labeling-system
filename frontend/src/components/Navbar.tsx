import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-white hover:text-gray-300">
          GenAI Labeler
        </Link>
        <div className="space-x-4">
          <Link href="/" className="text-gray-300 hover:text-white">
            Home
          </Link>
          <Link href="/admin/upload" className="text-gray-300 hover:text-white">
            Admin Upload
          </Link>
          <Link href="/labeler/task" className="text-gray-300 hover:text-white">
            Labeler Task
          </Link>
        </div>
      </div>
    </nav>
  );
} 
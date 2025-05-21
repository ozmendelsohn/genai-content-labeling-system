import Image from "next/image";

export default function HomePage() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to the GenAI Content Detection Assistant</h1>
      <p className="text-xl text-gray-300">This tool helps labelers identify AI-generated web content.</p>
      <p className="mt-6 text-gray-400">Navigate using the menu above to access admin or labeler functionalities.</p>
    </div>
  );
}

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
      <div className="flex items-center space-x-4">
        <Link
          href="https://github.com/M4BRU"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-black flex items-center space-x-1"
        >
          <FaGithub size={24} />
          <span className="hidden sm:inline">GitHub</span>
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Bout Project</h1>
      </div>

      <ConnectButton />
    </header>
  );
}

"use client";

import { FcGoogle } from "react-icons/fc";

interface Props {
    onClick?: () => void;
}

export default function GoogleButton({ onClick }: Props) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="
        flex
        w-full
        items-center
        justify-center
        gap-3
        rounded-xl
        border
        border-white/10
        bg-white
        px-5
        py-3
        font-medium
        text-black
        transition-all
        duration-200
        hover:scale-[1.02]
        hover:shadow-xl
        hover:bg-gray-100
        active:scale-[0.98]
      "
        >
            <FcGoogle size={22} />

            <span>Continue with Google</span>
        </button>
    );
}
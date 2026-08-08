"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

interface Props {
    mode: "none" | "login" | "register";
    close: () => void;
    switchMode: (mode: "login" | "register") => void;
    onSuccess: () => void;
}

export default function AuthOverlay({
    mode,
    close,
    switchMode,
    onSuccess,
}: Props) {
    useEffect(() => {
        function handler(e: KeyboardEvent) {
            if (e.key === "Escape") close();
        }

        window.addEventListener("keydown", handler);

        return () =>
            window.removeEventListener("keydown", handler);
    }, [close]);

    return (
        <AnimatePresence>

            {mode !== "none" && (

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={close}
                    className="
          fixed
          inset-0
          z-[100]
          flex
          items-center
          justify-center
          bg-black/70
          backdrop-blur-xl
          px-6
          "
                >

                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{
                            opacity: 0,
                            y: 40,
                            scale: .95,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 40,
                            scale: .95,
                        }}
                        transition={{
                            duration: .35,
                        }}
                        className="
            relative
            w-full
            max-w-lg
            rounded-3xl
            border
            border-white/10
            bg-[#0B1120]
            p-10
            shadow-2xl
            "
                    >

                        <button
                            onClick={close}
                            className="
              absolute
              right-5
              top-5
              rounded-full
              p-2
              text-gray-400
              transition
              hover:bg-white/5
              hover:text-white
              "
                        >
                            <X size={20} />
                        </button>

                        {mode === "login" ? (
                            <LoginForm
                                switchToRegister={() =>
                                    switchMode("register")
                                }
                                onSuccess={onSuccess}
                            />
                        ) : (
                            <RegisterForm
                                switchToLogin={() =>
                                    switchMode("login")
                                }
                                onSuccess={onSuccess}
                            />
                        )}

                    </motion.div>

                </motion.div>

            )}

        </AnimatePresence>
    );
}
"use client";

import { motion } from "framer-motion";
import { Frown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotFound() {

    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push("/");
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    const containerVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } },
    };

    const textVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background text-center px-4">
            <motion.div
                className="max-w-md mx-auto space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="flex flex-col items-center justify-center space-y-4"
                    variants={textVariants}
                >
                    <Frown className="w-16 h-16 text-primary dark:text-dark-primary" />
                    <h1 className="text-6xl md:text-8xl font-bold text-foreground dark:text-dark-foreground">
                        404
                    </h1>
                    <p className="text-2xl font-semibold text-primary dark:text-dark-primary">
                        Page Not Found
                    </p>
                </motion.div>

                <motion.p
                    className="text-lg text-muted-foreground dark:text-dark-muted-foreground"
                    variants={textVariants}
                >
                    Oops! It looks like the page you were trying to reach doesn&apos;t exist or has been moved.
                </motion.p>

                <motion.div variants={textVariants}>
                    <Link href="/">
                        <span className="inline-block px-8 py-4 bg-primary dark:bg-dark-primary text-primary-foreground dark:text-dark-primary-foreground font-semibold rounded-lg hover:bg-primary/90 dark:hover:bg-dark-primary/90 transition-colors">
                            Go Back to Homepage
                        </span>
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
    words: string[];
    className?: string;
    cursorClassName?: string;
}

export const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
    words,
    className,
    cursorClassName
}) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentText, setCurrentText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const word = words[currentWordIndex];
        const typeSpeed = isDeleting ? 50 : 100;
        const deleteSpeed = 50;
        const pauseTime = 2000;

        const handleType = () => {
            // Deleting
            if (isDeleting) {
                setCurrentText(word.substring(0, currentText.length - 1));
                if (currentText.length === 0) {
                    setIsDeleting(false);
                    setCurrentWordIndex((prev) => (prev + 1) % words.length);
                }
            }
            // Typing
            else {
                setCurrentText(word.substring(0, currentText.length + 1));
                if (currentText.length === word.length) {
                    setTimeout(() => setIsDeleting(true), pauseTime);
                    return; // Pause before deleting
                }
            }
        };

        const timer = setTimeout(handleType, isDeleting ? deleteSpeed : typeSpeed);
        return () => clearTimeout(timer);
    }, [currentText, isDeleting, currentWordIndex, words]);

    return (
        <div className={className}>
            <motion.span>{currentText}</motion.span>
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={cursorClassName}
            >
                |
            </motion.span>
        </div>
    );
};

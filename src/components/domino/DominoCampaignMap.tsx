
"use client";
import React from "react";
import { CAMPAIGN_MAPS, type CampaignMap, type LevelConfig } from "@/lib/domino/campaign";
import { Lock, Star, Play, Map as MapIcon, Trophy } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DominoCampaignMap() {
    const [selectedMap, setSelectedMap] = React.useState<CampaignMap | null>(null);

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-4 pb-20 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Link href="/games/domino/online" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        <span className="font-bold">←</span>
                    </div>
                    <span>رجوع للوبي</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Trophy className="text-amber-500" />
                    <h1 className="text-2xl font-black text-amber-500">مغامرة الدومينو</h1>
                </div>
                <div className="w-24" /> {/* Spacer */}
            </div>

            {/* Map Selection */}
            <AnimatePresence mode="wait">
                {!selectedMap ? (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
                    >
                        {CAMPAIGN_MAPS.map((map, idx) => (
                            <motion.div
                                key={map.id}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => setSelectedMap(map)}
                                className={`
                                    group relative aspect-video rounded-3xl overflow-hidden cursor-pointer border-4 transition-all hover:scale-105 hover:shadow-2xl
                                    ${idx === 0 ? "border-amber-500 shadow-amber-900/20" : "border-zinc-800 grayscale hover:grayscale-0"}
                                `}
                            >
                                <img src={map.bgImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                                
                                <div className="absolute bottom-0 left-0 right-0 p-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className={`text-2xl font-black ${idx === 0 ? "text-amber-400" : "text-zinc-300"}`}>{map.name}</h3>
                                        {idx > 0 && <Lock className="text-zinc-500" />}
                                    </div>
                                    <p className="text-sm text-zinc-300 line-clamp-2">{map.description}</p>
                                    <div className="mt-4 flex items-center gap-2">
                                        <div className="flex -space-x-1">
                                            {Array.from({length: 3}).map((_, i) => (
                                                <Star key={i} size={16} className={`${idx === 0 ? "text-amber-500 fill-amber-500" : "text-zinc-700"}`} />
                                            ))}
                                        </div>
                                        <span className="text-xs text-zinc-400 font-bold px-2 py-1 bg-black/50 rounded-full">
                                            {map.levels.length} مراحل
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, x: 100 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -100 }}
                        className="max-w-4xl mx-auto"
                    >
                        {/* Selected Map Header */}
                        <div className="flex items-center gap-4 mb-8">
                            <button 
                                onClick={() => setSelectedMap(null)}
                                className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                            >
                                <span className="font-bold">←</span>
                            </button>
                            <div>
                                <h2 className="text-3xl font-black text-white">{selectedMap.name}</h2>
                                <p className="text-zinc-400">{selectedMap.description}</p>
                            </div>
                        </div>

                        {/* Levels Path */}
                        <div className="relative space-y-4">
                            {/* Connector Line */}
                            <div className="absolute left-8 top-8 bottom-8 w-1 bg-zinc-800 -z-10" />

                            {selectedMap.levels.map((level, i) => {
                                const isLocked = level.locked; // Logic can be improved with saved progress
                                return (
                                    <motion.div 
                                        key={level.id}
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`flex items-center gap-6 p-4 rounded-2xl border-2 transition-all
                                            ${isLocked ? "bg-zinc-900/50 border-zinc-800 opacity-70" : "bg-zinc-900 border-amber-500/30 hover:border-amber-500 hover:bg-zinc-800 cursor-pointer"}
                                        `}
                                    >
                                        {/* Level Number Bubble */}
                                        <div className={`
                                            w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xl z-10 shrink-0
                                            ${isLocked ? "bg-zinc-800 text-zinc-600" : "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-900/20"}
                                        `}>
                                            <span>{level.levelNumber}</span>
                                            {isLocked && <Lock size={14} className="mt-1 opacity-50" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1">
                                            <h4 className={`text-lg font-bold ${isLocked ? "text-zinc-500" : "text-white"}`}>{level.title}</h4>
                                            <p className="text-sm text-zinc-400">{level.description}</p>
                                            
                                            {/* Rewards Preview */}
                                            {!isLocked && (
                                                <div className="flex items-center gap-3 mt-2 text-xs font-bold">
                                                    <span className="text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <span>💰</span> {level.rewards.coins}
                                                    </span>
                                                    <span className="text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                                                        <span>⚡</span> {level.rewards.xp}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        {!isLocked && (
                                            <Link 
                                                href={`/games/domino/training?campaign=true&map=${selectedMap.id}&level=${level.id}`}
                                                className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-amber-500/20"
                                            >
                                                <Play fill="currentColor" size={20} />
                                            </Link>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import React from "react";
import Image from "next/image";
import { WatermarkBadge } from "@/components/ui/WatermarkBadge";

interface EventStep {
  number: string;
  time: string;
  title: string;
  description: string;
  imageUrl: string;
}

const celebrationEvents: EventStep[] = [
  {
    number: "01",
    time: "2:00 PM",
    title: "The Ceremony & Exchange of Vows",
    description:
      "A sacred ceremony nestled beneath arched florals, acoustic melodies, and emotional promises for a lifetime.",
    imageUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
  },
  {
    number: "02",
    time: "3:30 PM",
    title: "Champagne Reception & Canapés",
    description:
      "Crystal glasses raised in the conservatory gardens with live jazz and joyful reunions among cherished friends.",
    imageUrl:
      "https://images.unsplash.com/photo-1510076857177-7470076d4498?auto=format&fit=crop&w=800&q=80",
  },
  {
    number: "03",
    time: "5:30 PM",
    title: "The Golden Hour Portraits",
    description:
      "Chasing Surrey's golden sunset light across manicured lawns and serene architectural vistas.",
    imageUrl:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=800&q=80",
  },
  {
    number: "04",
    time: "7:00 PM",
    title: "Candlelight Dinner & Speeches",
    description:
      "A culinary feast punctuated by hilarious anecdotes, nostalgic memories, and heartfelt tears.",
    imageUrl:
      "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=80",
  },
  {
    number: "05",
    time: "9:00 PM",
    title: "The First Dance & Celebration",
    description:
      "Twirling to our favorite song, followed by an unforgettable night of dancing, laughter, and sparklers.",
    imageUrl:
      "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=800&q=80",
  },
];

export function CelebrationDetails() {
  return (
    <section id="celebration" className="py-24 sm:py-32 px-6 sm:px-10 bg-[#FAF7F2]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <span className="text-xs tracking-[0.25em] uppercase text-[#C5A059] font-medium block mb-3">
            Moments To Remember
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl tracking-[0.06em] uppercase text-[#22201E] font-normal">
            The Celebration
          </h2>
          <div className="w-16 h-[1.5px] bg-[#C5A059] mx-auto my-4" />
          <p className="text-sm sm:text-base text-[#746E65] font-light leading-relaxed">
            Every chapter of our wedding day held its own unique magic. Explore the milestones
            captured throughout our unforgettable celebration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {celebrationEvents.slice(0, 3).map((event) => (
            <div
              key={event.number}
              className="group bg-white border border-[#EAE3D9] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_15px_30px_rgba(34,32,30,0.06)] hover:border-[#C5A059]/50"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F5EFEB]">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute top-3 left-3 bg-[#FAF7F2]/90 backdrop-blur-sm border border-[#D9CEB2] px-2.5 py-1 text-[11px] tracking-[0.18em] font-sans text-[#22201E] uppercase">
                  {event.time}
                </div>
                <WatermarkBadge size="sm" />
              </div>

              <div className="p-6 sm:p-7 flex-1 flex flex-col">
                <span className="font-serif text-3xl text-[#C5A059] font-light mb-2">
                  {event.number}
                </span>
                <h3 className="font-serif text-xl text-[#22201E] font-medium mb-3">
                  {event.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#746E65] font-light leading-relaxed flex-1">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: 2 wider cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {celebrationEvents.slice(3, 5).map((event) => (
            <div
              key={event.number}
              className="group bg-white border border-[#EAE3D9] overflow-hidden flex flex-col sm:flex-row transition-all duration-300 hover:shadow-[0_15px_30px_rgba(34,32,30,0.06)] hover:border-[#C5A059]/50"
            >
              <div className="relative aspect-[4/3] sm:aspect-[1/1] sm:w-1/2 overflow-hidden bg-[#F5EFEB]">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute top-3 left-3 bg-[#FAF7F2]/90 backdrop-blur-sm border border-[#D9CEB2] px-2.5 py-1 text-[11px] tracking-[0.18em] font-sans text-[#22201E] uppercase">
                  {event.time}
                </div>
                <WatermarkBadge size="sm" />
              </div>

              <div className="p-6 sm:p-7 sm:w-1/2 flex flex-col justify-center">
                <span className="font-serif text-3xl text-[#C5A059] font-light mb-2">
                  {event.number}
                </span>
                <h3 className="font-serif text-xl text-[#22201E] font-medium mb-3">
                  {event.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#746E65] font-light leading-relaxed">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

<<<<<<< HEAD

=======
>>>>>>> 370eca2 (Initial commit)
import { Candy, Lollipop, Cookie } from "lucide-react";

export default function FloatingDecoration() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
<<<<<<< HEAD
      {/* Круглый леденец на палочке */}
      <div 
        className="absolute w-20 h-20 rounded-full lollipop-swirl border-8 border-white shadow-2xl animate-rotate-slow opacity-50"
        style={{ top: '10%', left: '5%', animationDelay: '0s' }}
      >
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-2 h-16 bg-gradient-to-b from-white to-gray-300 rounded-full"></div>
      </div>
      
      {/* Мармеладка в форме сердца */}
      <div 
        className="absolute w-16 h-16 animate-float-slow opacity-45"
        style={{ 
          top: '20%', 
          right: '10%', 
          animationDelay: '0.5s',
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-red-400 to-pink-500 sugar-crystals" 
          style={{
            clipPath: 'polygon(50% 10%, 85% 0%, 100% 35%, 100% 70%, 50% 100%, 0% 70%, 0% 35%, 15% 0%)'
          }}
        >
          <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent" 
            style={{
              clipPath: 'inherit'
            }}
          ></div>
        </div>
      </div>

      {/* Маршмелоу - мягкая подушечка */}
      <div 
        className="absolute w-16 h-12 bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl animate-float-medium opacity-40 sugar-crystals"
        style={{ top: '30%', left: '15%', animationDelay: '1s' }}
      >
        <div className="absolute inset-2 bg-gradient-to-br from-white/60 to-transparent rounded-xl"></div>
      </div>

      {/* Звёздочка-леденец */}
      <div 
        className="absolute w-16 h-16 animate-wiggle opacity-35"
        style={{ 
          bottom: '20%', 
          right: '8%', 
          animationDelay: '1.5s',
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-yellow-300 to-orange-400 metallic-wrapper"
          style={{
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
          }}
        >
        </div>
      </div>

      {/* Круглая мармеладка с сахарными кристаллами */}
      <div 
        className="absolute w-16 h-16 rounded-full lollipop-swirl-badge shadow-2xl border-6 border-white/80 animate-rotate-slow opacity-45"
        style={{ bottom: '35%', left: '12%', animationDelay: '2s', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
      />

      {/* Маршмелоу розовое */}
      <div 
        className="absolute flex items-center justify-center w-16 h-12 bg-gradient-to-br from-purple-200 to-purple-300 rounded-2xl animate-float-slow opacity-35 rotate-12 sugar-crystals"
        style={{ top: '50%', right: '20%', animationDelay: '2.5s' }}
      >
        <div className="absolute inset-2 bg-gradient-to-br from-white/60 to-transparent rounded-xl"></div>
      </div>

      {/* Леденец-сердечко */}
      <div 
        className="absolute w-14 h-14 animate-bounce-soft opacity-40"
        style={{ 
          top: '60%', 
          left: '8%', 
          animationDelay: '3s',
        }}
      >
        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600"
          style={{
            clipPath: 'polygon(50% 10%, 85% 0%, 100% 35%, 100% 70%, 50% 100%, 0% 70%, 0% 35%, 15% 0%)'
          }}
        >
          <div className="absolute inset-2 bg-gradient-to-br from-white/50 to-transparent"
            style={{
              clipPath: 'inherit'
            }}
          ></div>
        </div>
      </div>

      {/* Мармеладка-квадратик */}
      <div 
        className="absolute flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl animate-float-medium opacity-35 -rotate-12 sugar-crystals"
        style={{ bottom: '45%', right: '25%', animationDelay: '3.5s' }}
      >
        <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent rounded-lg"></div>
      </div>

      {/* Радужный леденец */}
      <div 
        className="absolute w-14 h-20 bg-gradient-to-br from-red-400 to-rose-600 animate-wiggle opacity-30 candy-wrapper"
=======
      <div 
        className="absolute w-24 h-24 donut-shape donut-sprinkles animate-float-slow opacity-40"
        style={{ top: '10%', left: '5%', animationDelay: '0s' }}
      />
      
      <div 
        className="absolute w-20 h-20 rounded-full lollipop-swirl border-8 border-white shadow-2xl animate-rotate-slow opacity-50"
        style={{ top: '20%', right: '10%', animationDelay: '0.5s' }}
      >
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-2 h-16 bg-gradient-to-b from-white to-gray-300 rounded-full"></div>
      </div>

      <div 
        className="absolute w-16 h-24 bg-gradient-to-br from-pink-400 to-pink-600 rounded-3xl candy-wrapper animate-float-medium opacity-30"
        style={{ top: '30%', left: '15%', animationDelay: '1s' }}
      >
        <div className="absolute inset-2 bg-gradient-to-br from-white/40 to-transparent rounded-3xl"></div>
      </div>

      <div 
        className="absolute w-20 h-20 donut-shape donut-sprinkles animate-wiggle opacity-35"
        style={{ bottom: '20%', right: '8%', animationDelay: '1.5s', background: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)' }}
      />

      <div 
        className="absolute w-16 h-16 rounded-full lollipop-swirl-badge shadow-2xl border-6 border-white/80 animate-rotate-slow opacity-45"
        style={{ bottom: '35%', left: '12%', animationDelay: '2s' }}
      />

      <div 
        className="absolute flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl animate-float-slow opacity-30 rotate-12 sugar-crystals"
        style={{ top: '50%', right: '20%', animationDelay: '2.5s' }}
      >
        <Candy className="w-10 h-10 text-white/80" />
      </div>

      <div 
        className="absolute w-18 h-18 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full animate-bounce-soft opacity-40 metallic-wrapper"
        style={{ top: '60%', left: '8%', animationDelay: '3s', width: '72px', height: '72px' }}
      />

      <div 
        className="absolute flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl animate-float-medium opacity-35 -rotate-12"
        style={{ bottom: '45%', right: '25%', animationDelay: '3.5s' }}
      >
        <Cookie className="w-8 h-8 text-white/90" />
      </div>

      <div 
        className="absolute w-14 h-20 bg-gradient-to-br from-red-400 to-rose-600 animate-wiggle opacity-30"
>>>>>>> 370eca2 (Initial commit)
        style={{ 
          top: '70%', 
          right: '15%', 
          animationDelay: '4s',
          clipPath: 'polygon(30% 0%, 70% 0%, 85% 15%, 85% 85%, 70% 100%, 30% 100%, 15% 85%, 15% 15%)'
        }}
      >
        <div className="absolute inset-2 bg-gradient-to-br from-white/30 to-transparent" style={{
          clipPath: 'inherit'
        }}></div>
      </div>

<<<<<<< HEAD
      {/* Маленький леденец на палочке */}
=======
>>>>>>> 370eca2 (Initial commit)
      <div 
        className="absolute flex items-center justify-center"
        style={{ top: '15%', left: '35%', animationDelay: '4.5s' }}
      >
        <div className="w-12 h-12 rounded-full lollipop-swirl border-4 border-pink-200 shadow-lg animate-rotate-slow opacity-40">
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-1.5 h-12 bg-gradient-to-b from-pink-200 to-pink-100 rounded-full"></div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Маршмелоу желтое */}
      <div 
        className="absolute w-16 h-12 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-2xl animate-float-slow opacity-35 sugar-crystals"
        style={{ top: '80%', left: '40%', animationDelay: '5s' }}
      >
        <div className="absolute inset-2 bg-gradient-to-br from-white/60 to-transparent rounded-xl"></div>
=======
      <div 
        className="absolute w-16 h-16 donut-shape donut-sprinkles animate-float-slow opacity-35"
        style={{ top: '80%', left: '40%', animationDelay: '5s', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}
      />

      <div 
        className="absolute flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full animate-sparkle opacity-30"
        style={{ bottom: '60%', left: '30%', animationDelay: '5.5s' }}
      >
        <Lollipop className="w-7 h-7 text-white/90" />
>>>>>>> 370eca2 (Initial commit)
      </div>
    </div>
  );
}

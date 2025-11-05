// AI Video Generation Prompt Examples

export interface PromptExample {
  id: string;
  title: string;
  prompt: string;
  category: string;
  aspectRatio?: '9:16' | '16:9';
}

// Text-to-video datasets
export const promptCategories = [
  'Cinematic',
  'Nature & Wildlife',
  'Urban & Architecture',
  'Abstract & Artistic',
  'Product & Commercial',
  'Character & Animation',
  'Action & Sports',
  'Food & Lifestyle'
];

export const promptExamples: PromptExample[] = [
  // Cinematic
  {
    id: 'cinema-1',
    title: 'Epic Mountain Sunset',
    prompt: 'A cinematic shot of a lone figure standing on a mountain peak at golden hour. The camera slowly circles around as dramatic clouds roll through valleys below. Warm orange and purple hues illuminate the scene with volumetric light rays piercing through the atmosphere. Shot with anamorphic lens, film grain texture.',
    category: 'Cinematic',
    aspectRatio: '16:9'
  },
  {
    id: 'cinema-2',
    title: 'Futuristic City Flythrough',
    prompt: 'A sweeping aerial view of a futuristic cyberpunk city at night. Neon lights reflect off wet streets as flying vehicles zoom between towering skyscrapers. Holographic advertisements float in the air. Camera glides smoothly through the urban canyon with dramatic perspective shifts. Cinematic color grading with teal and orange tones.',
    category: 'Cinematic',
    aspectRatio: '16:9'
  },
  {
    id: 'cinema-3',
    title: 'Time-Lapse Metropolis',
    prompt: 'A dramatic time-lapse of a modern metropolis from dusk to night. The sky transitions from deep blue to starry black as city lights gradually illuminate. Traffic flows like rivers of light through highways. Clouds drift rapidly overhead. Ultra-wide angle, hyper-lapse style with smooth motion.',
    category: 'Cinematic',
    aspectRatio: '16:9'
  },

  // Nature & Wildlife
  {
    id: 'nature-1',
    title: 'Ocean Wave Close-Up',
    prompt: 'An extreme slow-motion close-up of a translucent ocean wave curling and crashing. Sunlight refracts through the water creating prismatic rainbow effects. Water droplets suspended in air catch the light. Shot at 1000fps with macro lens, crystal clear water detail, shallow depth of field.',
    category: 'Nature & Wildlife',
    aspectRatio: '16:9'
  },
  {
    id: 'nature-2',
    title: 'Hummingbird in Garden',
    prompt: 'A vibrant hummingbird hovering near a red hibiscus flower in a lush tropical garden. Its iridescent feathers shimmer in sunlight as wings blur with rapid motion. Camera tracks the bird smoothly as it moves from flower to flower. Soft bokeh background with natural lighting. Documentary wildlife style.',
    category: 'Nature & Wildlife',
    aspectRatio: '16:9'
  },
  {
    id: 'nature-3',
    title: 'Northern Lights Timelapse',
    prompt: 'A mesmerizing timelapse of aurora borealis dancing across a starry Arctic sky. Green and purple light curtains wave and pulse above a snowy landscape with silhouetted pine trees. Milky Way visible in background. Wide-angle shot with long exposure effect.',
    category: 'Nature & Wildlife',
    aspectRatio: '16:9'
  },

  // Urban & Architecture
  {
    id: 'urban-1',
    title: 'Busy Tokyo Intersection',
    prompt: 'A bird\'s eye view of the famous Shibuya crossing in Tokyo at rush hour. Hundreds of people cross the intersection from all directions in organized chaos. Neon signs and giant LED screens illuminate the scene. Camera pulls back to reveal the scale. Urban documentary style with vibrant colors.',
    category: 'Urban & Architecture',
    aspectRatio: '16:9'
  },
  {
    id: 'urban-2',
    title: 'Modern Architecture Tour',
    prompt: 'A smooth tracking shot along a modern glass and steel building facade. The camera glides upward revealing geometric patterns and reflections of clouds in windows. Sunlight creates dramatic shadows and highlights on angular surfaces. Architectural photography style, minimalist composition.',
    category: 'Urban & Architecture',
    aspectRatio: '9:16'
  },
  {
    id: 'urban-3',
    title: 'Subway Station Rush',
    prompt: 'A dynamic timelapse inside a modern subway station during rush hour. Commuters blur past the camera as trains arrive and depart. Fluorescent lights create a cool blue atmosphere. Motion streaks and light trails emphasize the speed and energy. Urban lifestyle cinematography.',
    category: 'Urban & Architecture',
    aspectRatio: '16:9'
  },

  // Abstract & Artistic
  {
    id: 'abstract-1',
    title: 'Liquid Color Explosion',
    prompt: 'An abstract explosion of vibrant liquid colors mixing in water. Inks of cyan, magenta, and yellow swirl and blend creating organic flowing patterns. Shot in extreme slow motion against white background. Macro photography with high-speed camera. Psychedelic and mesmerizing motion.',
    category: 'Abstract & Artistic',
    aspectRatio: '9:16'
  },
  {
    id: 'abstract-2',
    title: 'Particle Symphony',
    prompt: 'Millions of glowing particles dance and swirl in three-dimensional space forming abstract shapes and patterns. Colors shift from warm gold to cool blue. Particles cluster and disperse in rhythmic waves. Black background with depth of field creating layers. Meditative and hypnotic motion.',
    category: 'Abstract & Artistic',
    aspectRatio: '16:9'
  },
  {
    id: 'abstract-3',
    title: 'Geometric Morphing',
    prompt: 'Clean geometric shapes morphing and transforming into each other in seamless loops. Cubes unfold into stars, spheres melt into pyramids. Minimal color palette of white and pastels on gradient background. Smooth 3D animation with perfect symmetry. Modern motion graphics style.',
    category: 'Abstract & Artistic',
    aspectRatio: '9:16'
  },

  // Product & Commercial
  {
    id: 'product-1',
    title: 'Luxury Watch Reveal',
    prompt: 'A luxury Swiss watch slowly rotating on a reflective black surface. Dramatic studio lighting highlights the metallic finish and intricate details. Camera slowly pushes in revealing craftsmanship of gears through transparent case back. High-end product photography with shallow depth of field.',
    category: 'Product & Commercial',
    aspectRatio: '9:16'
  },
  {
    id: 'product-2',
    title: 'Smartphone Showcase',
    prompt: 'A sleek modern smartphone floating and rotating in minimalist white environment. Screen displays vibrant interface with smooth animations. Reflections and highlights emphasize premium materials. Camera orbits around device with elegant motion. Apple-style commercial aesthetic.',
    category: 'Product & Commercial',
    aspectRatio: '9:16'
  },
  {
    id: 'product-3',
    title: 'Coffee Brewing Process',
    prompt: 'A close-up sequence of espresso being extracted from a professional coffee machine. Rich dark coffee streams into a white cup creating beautiful crema. Steam rises elegantly. Warm lighting emphasizes the rich brown tones. Slow motion capture of pour with shallow focus.',
    category: 'Product & Commercial',
    aspectRatio: '16:9'
  },

  // Character & Animation
  {
    id: 'character-1',
    title: 'Robot Assistant',
    prompt: 'A friendly humanoid robot assistant in a modern smart home environment. The robot has expressive LED eyes and smooth white chassis. It gestures naturally while demonstrating features. Warm interior lighting with clean modern aesthetic. Pixar-style character animation with personality.',
    category: 'Character & Animation',
    aspectRatio: '16:9'
  },
  {
    id: 'character-2',
    title: 'Fantasy Creature',
    prompt: 'A majestic dragon perched on a cliff edge overlooking a fantasy landscape. Its scales shimmer with iridescent colors as it spreads enormous wings. Sunlight filters through wing membranes. The creature tilts its head curiously before taking flight. Cinematic fantasy style with detailed textures.',
    category: 'Character & Animation',
    aspectRatio: '16:9'
  },
  {
    id: 'character-3',
    title: 'Animated Chef',
    prompt: 'A cheerful cartoon chef character in a colorful kitchen tossing ingredients in a pan. Exaggerated movements and expressions full of energy. Vegetables and spices float through the air. Bright saturated colors with playful animation style. Family-friendly content vibe.',
    category: 'Character & Animation',
    aspectRatio: '9:16'
  },

  // Action & Sports
  {
    id: 'action-1',
    title: 'Surfer on Wave',
    prompt: 'A professional surfer carving through a massive turquoise wave. Water spray creates a dramatic effect as the board cuts through the surface. Camera tracks alongside maintaining pace with the action. Golden hour lighting with crystal clear water. GoPro POV style mixed with tracking shot.',
    category: 'Action & Sports',
    aspectRatio: '16:9'
  },
  {
    id: 'action-2',
    title: 'Parkour in City',
    prompt: 'A parkour athlete performing fluid movements across urban rooftops. Jumping between buildings, vaulting over obstacles with grace and precision. Dynamic camera angles switching between wide shots and close-ups. Late afternoon sun creates long dramatic shadows. Action sports cinematography.',
    category: 'Action & Sports',
    aspectRatio: '16:9'
  },
  {
    id: 'action-3',
    title: 'Skateboard Trick',
    prompt: 'Extreme slow motion of a skateboarder executing a kickflip down a set of stairs. Board spins perfectly as rider maintains control. Camera follows trajectory from multiple angles. Gritty urban environment with graffiti walls. Street sports photography style with high contrast.',
    category: 'Action & Sports',
    aspectRatio: '9:16'
  },

  // Food & Lifestyle
  {
    id: 'food-1',
    title: 'Sushi Preparation',
    prompt: 'A master sushi chef expertly preparing nigiri in a traditional Japanese restaurant. Close-up shots of precise knife work cutting fresh salmon. Rice being molded with practiced hands. Elegant presentation on wooden serving board. Natural window lighting with clean aesthetic. ASMR-style detail focus.',
    category: 'Food & Lifestyle',
    aspectRatio: '16:9'
  },
  {
    id: 'food-2',
    title: 'Chocolate Fountain',
    prompt: 'Rich molten chocolate cascading in slow motion creating elegant flowing ribbons. Droplets splash and ripple on the surface below. Warm studio lighting emphasizes the glossy texture and deep brown color. Macro shot with shallow depth of field. Luxurious and indulgent feel.',
    category: 'Food & Lifestyle',
    aspectRatio: '9:16'
  },
  {
    id: 'food-3',
    title: 'Morning Coffee Routine',
    prompt: 'A peaceful morning coffee routine in a sunlit minimalist kitchen. Hands pouring hot water over a pour-over coffee maker. Steam rises gracefully as coffee drips into glass carafe. Soft natural lighting through sheer curtains. Lifestyle vlog aesthetic with cozy atmosphere.',
    category: 'Food & Lifestyle',
    aspectRatio: '9:16'
  }
];

export const getExamplesByCategory = (category: string): PromptExample[] => {
  return promptExamples.filter(example => example.category === category);
};

export const getRandomExamples = (count: number = 5): PromptExample[] => {
  const shuffled = [...promptExamples].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Image-to-video datasets
export const imagePromptCategories = [
  'Cinematic Camera Moves',
  'Lifestyle & Product Motion',
  'Nature & Travel',
  'Futuristic & Tech',
  'Portrait & Fashion',
  'Artistic Transformations'
];

export const imagePromptExamples: PromptExample[] = [
  {
    id: 'img-cine-1',
    title: 'Dolly Reveal',
    prompt: 'Starting from the still image, push the virtual camera forward in a smooth dolly motion while subtly tilting upward to reveal the skyline beyond. Add cinematic depth of field, gentle lens flare, and a polished color grade that leans into teal and amber tones.',
    category: 'Cinematic Camera Moves',
    aspectRatio: '16:9'
  },
  {
    id: 'img-cine-2',
    title: 'Orbiting Hero Move',
    prompt: 'Animate a slow, steady orbit move around the main subject from the reference frame, keeping the subject centered while the background parallax shifts. Introduce soft volumetric haze and subtle light rays drifting across the scene.',
    category: 'Cinematic Camera Moves',
    aspectRatio: '16:9'
  },
  {
    id: 'img-cine-3',
    title: 'Handheld Documentary',
    prompt: 'Convert the photo into a handheld-style video: apply gentle micro jitters, rack focus moments, and a quick tilt down to reveal additional context. Maintain natural daylight grading and authentic ambient camera shake.',
    category: 'Cinematic Camera Moves',
    aspectRatio: '16:9'
  },
  {
    id: 'img-life-1',
    title: 'Product Spin Highlight',
    prompt: 'Build a seamless 270° spin around the featured product from the still image, adding crisp studio lighting sweeps, reflective highlights, and floating callouts that fade in near the key details.',
    category: 'Lifestyle & Product Motion',
    aspectRatio: '9:16'
  },
  {
    id: 'img-life-2',
    title: 'Slow-Pour Macro',
    prompt: 'Zoom into the hero area and animate a slow-motion pour effect that emerges from out of frame, with macro depth of field, sparkling highlights on the liquid, and wisps of steam drifting upward.',
    category: 'Lifestyle & Product Motion',
    aspectRatio: '9:16'
  },
  {
    id: 'img-life-3',
    title: 'Morning Routine Loop',
    prompt: 'Animate subtle lifestyle motion: steam rising from a mug, soft sunlight sliding across the countertop, and a gentle camera slider move from left to right. Keep tones warm and inviting.',
    category: 'Lifestyle & Product Motion',
    aspectRatio: '16:9'
  },
  {
    id: 'img-nature-1',
    title: 'Mountain Breeze',
    prompt: 'Bring the landscape to life with drifting morning fog, swaying alpine grasses, and an overhead cloud casting moving shadows across the valley. Add a slow push-in to emphasize depth.',
    category: 'Nature & Travel',
    aspectRatio: '16:9'
  },
  {
    id: 'img-nature-2',
    title: 'Coastal Golden Hour',
    prompt: 'Animate rolling waves that shimmer in golden light, gulls gliding through frame, and lens flare streaks as the sun dips lower. Finish with a soft pullback to reveal more coastline.',
    category: 'Nature & Travel',
    aspectRatio: '16:9'
  },
  {
    id: 'img-nature-3',
    title: 'Rainforest Mist',
    prompt: 'Add cascading waterfall motion, drifting mist layers between foreground foliage, and shafts of light breaking through the canopy. Use a gentle crane move downward to showcase the full scene.',
    category: 'Nature & Travel',
    aspectRatio: '9:16'
  },
  {
    id: 'img-future-1',
    title: 'Neon Transit Loop',
    prompt: 'Transform the static city shot into a futuristic transit scene with light trails, holographic billboards flickering on, and drones gliding through frame. Employ a parallax pan to enhance scale.',
    category: 'Futuristic & Tech',
    aspectRatio: '16:9'
  },
  {
    id: 'img-future-2',
    title: 'Tech Showcase Macro',
    prompt: 'Animate illuminated circuitry flowing beneath the device surface, with pulses synced to a subtle UI glow. Add a slow rotational move and particle motes drifting in the air.',
    category: 'Futuristic & Tech',
    aspectRatio: '9:16'
  },
  {
    id: 'img-future-3',
    title: 'Cyber Alley Reveal',
    prompt: 'Introduce animated signage flickers, light rain hitting the pavement, and a forward tracking move deeper into the alley. Integrate volumetric neon reflections and rising steam.',
    category: 'Futuristic & Tech',
    aspectRatio: '16:9'
  },
  {
    id: 'img-portrait-1',
    title: 'Editorial Hair Flip',
    prompt: 'Starting from the portrait pose, animate a slow-motion hair flip, shifting studio lights to catch the highlights. Add a shallow depth of field rack focus from eyes to wardrobe details.',
    category: 'Portrait & Fashion',
    aspectRatio: '9:16'
  },
  {
    id: 'img-portrait-2',
    title: 'Runway Flash Pop',
    prompt: 'Simulate fashion runway flashes firing off around the subject while the camera glides forward. Add flowing fabric motion and a subtle wind effect around the wardrobe.',
    category: 'Portrait & Fashion',
    aspectRatio: '9:16'
  },
  {
    id: 'img-portrait-3',
    title: 'Cinematic Close-Up',
    prompt: 'Animate a slow push into the subject’s face with micro expressions, breathing cues, and catchlights intensifying in the eyes. Grade with polished skin tones and rich contrast.',
    category: 'Portrait & Fashion',
    aspectRatio: '16:9'
  },
  {
    id: 'img-art-1',
    title: 'Ink Bloom Transition',
    prompt: 'Morph painted elements outward from the image edges like ink blooming in water, with flowing brush textures and a camera roll that settles back into the hero composition.',
    category: 'Artistic Transformations',
    aspectRatio: '16:9'
  },
  {
    id: 'img-art-2',
    title: 'Sketch to Reality',
    prompt: 'Begin with line-art overlays that animate into full color, revealing the final image. Layer in pencil strokes, smudges, and a gentle zoom to emphasize the transformation.',
    category: 'Artistic Transformations',
    aspectRatio: '16:9'
  },
  {
    id: 'img-art-3',
    title: 'Gallery Frame Drift',
    prompt: 'Place the image within a virtual gallery frame, animate the frame rotating slightly while spotlights brighten, and add floating dust particles for atmosphere.',
    category: 'Artistic Transformations',
    aspectRatio: '9:16'
  }
];

export const getImageExamplesByCategory = (category: string): PromptExample[] => {
  return imagePromptExamples.filter(example => example.category === category);
};

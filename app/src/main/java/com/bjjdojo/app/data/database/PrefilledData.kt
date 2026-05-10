package com.bjjdojo.app.data.database

import com.bjjdojo.app.data.entities.*

object PrefilledData {

    val categories = listOf(
        Category(1, "Guards", "Positions on your back controlling the opponent", "shield"),
        Category(2, "Guard Passing", "Techniques to bypass the opponent's guard", "arrow_forward"),
        Category(3, "Sweeps", "Reversals from bottom position to top", "swap_vert"),
        Category(4, "Submissions", "Finishing techniques — chokes and joint locks", "emoji_events"),
        Category(5, "Takedowns & Throws", "Taking the fight to the ground", "sports_martial_arts"),
        Category(6, "Escapes", "Recovering from bad positions", "exit_to_app"),
        Category(7, "Positions", "Dominant control positions", "grid_view")
    )

    val techniques = listOf(
        // ── Guards (1xx) ────────────────────────────────────────────────────
        Technique(
            101, "Closed Guard", "Classic guard with legs locked behind the opponent's back, controlling posture and creating attack angles.",
            1, "https://www.youtube.com/results?search_query=bjj+closed+guard+fundamentals", Difficulty.BEGINNER
        ),
        Technique(
            102, "Half Guard", "One leg trapping one of the opponent's legs, providing guard retention and sweep opportunities.",
            1, "https://www.youtube.com/results?search_query=bjj+half+guard+attacks+sweeps", Difficulty.BEGINNER
        ),
        Technique(
            103, "Butterfly Guard", "Seated guard using the hooks (insteps) against the opponent's thighs to off-balance and sweep.",
            1, "https://www.youtube.com/results?search_query=bjj+butterfly+guard+complete+guide", Difficulty.INTERMEDIATE
        ),
        Technique(
            104, "Spider Guard", "Gripping the opponent's sleeves while using feet on biceps to control distance and attack.",
            1, "https://www.youtube.com/results?search_query=bjj+spider+guard+attacks+sweeps", Difficulty.INTERMEDIATE
        ),
        Technique(
            105, "De La Riva Guard", "One-leg hook on the outside of the opponent's leg with sleeve/ankle control.",
            1, "https://www.youtube.com/results?search_query=de+la+riva+guard+bjj+basics", Difficulty.INTERMEDIATE
        ),
        Technique(
            106, "X-Guard", "Both hooks under opponent's thighs in an X shape, creating extreme off-balance for sweeps.",
            1, "https://www.youtube.com/results?search_query=x+guard+bjj+sweeps+entries", Difficulty.ADVANCED
        ),
        Technique(
            107, "Lasso Guard", "Wrapping the arm in a lasso with the leg to immobilize the arm and create attack angles.",
            1, "https://www.youtube.com/results?search_query=lasso+guard+bjj+sweeps+submissions", Difficulty.ADVANCED
        ),
        Technique(
            108, "Rubber Guard", "High guard position with leg behind the neck, popularised by Eddie Bravo.",
            1, "https://www.youtube.com/results?search_query=rubber+guard+bjj+10th+planet", Difficulty.ADVANCED
        ),
        Technique(
            109, "Single Leg X (SLX)", "One hook between the opponent's legs controlling a single leg for sweeps and leg-lock entries.",
            1, "https://www.youtube.com/results?search_query=single+leg+x+guard+bjj+ashi+garami", Difficulty.ADVANCED
        ),
        Technique(
            110, "Worm Guard", "DLR variation using the lapel threaded around the leg for extreme control and sweeps.",
            1, "https://www.youtube.com/results?search_query=worm+guard+bjj+keenan+cornelius", Difficulty.ELITE
        ),

        // ── Guard Passing (2xx) ─────────────────────────────────────────────
        Technique(
            201, "Torreando Pass", "Using grips on the knees/ankles to swing the legs aside and pass laterally.",
            2, "https://www.youtube.com/results?search_query=torreando+pass+bjj+fundamentals", Difficulty.BEGINNER
        ),
        Technique(
            202, "Double Under Pass", "Shooting both arms under the legs to stack and pass the guard.",
            2, "https://www.youtube.com/results?search_query=double+under+pass+bjj+pressure+passing", Difficulty.INTERMEDIATE
        ),
        Technique(
            203, "Over-Under Pass", "One arm over one leg and one arm under the other, a powerful pressure pass.",
            2, "https://www.youtube.com/results?search_query=over+under+pass+bjj+bernardo+faria", Difficulty.INTERMEDIATE
        ),
        Technique(
            204, "Leg Drag", "Dragging one leg across the body while maintaining hip connection to create an angle for passing.",
            2, "https://www.youtube.com/results?search_query=leg+drag+pass+bjj+technique", Difficulty.INTERMEDIATE
        ),
        Technique(
            205, "Knee Slice Pass", "Driving the knee through the guard while controlling the hip, a common gi and no-gi pass.",
            2, "https://www.youtube.com/results?search_query=knee+slice+pass+bjj+fundamentals", Difficulty.BEGINNER
        ),
        Technique(
            206, "Smash Pass", "Stacking the opponent's legs while driving forward to flatten and pass.",
            2, "https://www.youtube.com/results?search_query=smash+pass+bjj+no+gi+technique", Difficulty.INTERMEDIATE
        ),
        Technique(
            207, "Bullfighter Pass (Toreando)", "Gripping both ankles/knees and redirecting the legs to either side to bypass the guard.",
            2, "https://www.youtube.com/results?search_query=bullfighter+pass+bjj+ankle+grip", Difficulty.BEGINNER
        ),
        Technique(
            208, "HQ / Headquarters Position", "A neutral passing position inside the guard, used to control and set up leg locks or passes.",
            2, "https://www.youtube.com/results?search_query=headquarters+position+bjj+nogi+passing", Difficulty.INTERMEDIATE
        ),

        // ── Sweeps (3xx) ────────────────────────────────────────────────────
        Technique(
            301, "Hip Bump Sweep", "Posting the hand and bumping the hip forward from closed guard to take top position.",
            3, "https://www.youtube.com/results?search_query=hip+bump+sweep+bjj+closed+guard", Difficulty.BEGINNER
        ),
        Technique(
            302, "Scissor Sweep", "Using a scissoring motion of the legs from closed guard to knock the opponent over.",
            3, "https://www.youtube.com/results?search_query=scissor+sweep+bjj+closed+guard+technique", Difficulty.BEGINNER
        ),
        Technique(
            303, "Flower Sweep (Pendulum)", "From closed guard, hooking a leg and sweeping with a pendulum motion.",
            3, "https://www.youtube.com/results?search_query=flower+sweep+pendulum+bjj+closed+guard", Difficulty.BEGINNER
        ),
        Technique(
            304, "Butterfly Sweep", "Using butterfly hooks to off-balance the opponent and sweep to the side.",
            3, "https://www.youtube.com/results?search_query=butterfly+sweep+bjj+technique+marcelo", Difficulty.INTERMEDIATE
        ),
        Technique(
            305, "X-Guard Sweep", "Sweeping from X-guard by extending the legs to dump the opponent forward or backward.",
            3, "https://www.youtube.com/results?search_query=x+guard+sweep+bjj+standing", Difficulty.ADVANCED
        ),
        Technique(
            306, "Berimbolo", "A spinning inversion from De La Riva to take the back or gain dominant position.",
            3, "https://www.youtube.com/results?search_query=berimbolo+bjj+mendes+brothers+technique", Difficulty.ELITE
        ),
        Technique(
            307, "De La Riva Sweep", "Various sweeps from the De La Riva guard attacking the near or far leg.",
            3, "https://www.youtube.com/results?search_query=de+la+riva+sweep+bjj+basic+intermediate", Difficulty.INTERMEDIATE
        ),
        Technique(
            308, "Tripod Sweep", "Using foot on the hip and foot on the bicep to sweep the opponent.",
            3, "https://www.youtube.com/results?search_query=tripod+sweep+bjj+spider+guard+no+gi", Difficulty.INTERMEDIATE
        ),

        // ── Submissions (4xx) ───────────────────────────────────────────────
        Technique(
            401, "Armbar", "Hyperextending the elbow joint by controlling the arm across the body — can be applied from many positions.",
            4, "https://www.youtube.com/results?search_query=armbar+bjj+guard+mount+technique+setup", Difficulty.BEGINNER
        ),
        Technique(
            402, "Triangle Choke", "Locking the head and arm with the legs in a figure-4 to cut off blood flow to the brain.",
            4, "https://www.youtube.com/results?search_query=triangle+choke+bjj+guard+technique", Difficulty.BEGINNER
        ),
        Technique(
            403, "Kimura", "A figure-4 grip on the wrist rotating the shoulder joint — applied from many positions.",
            4, "https://www.youtube.com/results?search_query=kimura+bjj+closed+guard+side+control", Difficulty.BEGINNER
        ),
        Technique(
            404, "Omoplata", "Shoulder lock using the legs to control the arm and rotate the shoulder.",
            4, "https://www.youtube.com/results?search_query=omoplata+bjj+submission+guard", Difficulty.INTERMEDIATE
        ),
        Technique(
            405, "Rear Naked Choke (RNC)", "Blood choke from the back — arm under the chin, arm behind the head.",
            4, "https://www.youtube.com/results?search_query=rear+naked+choke+bjj+finishing+technique", Difficulty.BEGINNER
        ),
        Technique(
            406, "Guillotine Choke", "Arm around the neck cutting off blood flow, applied from standing or guard.",
            4, "https://www.youtube.com/results?search_query=guillotine+choke+bjj+high+elbow+arm+in", Difficulty.BEGINNER
        ),
        Technique(
            407, "Outside Heel Hook", "Rotating the heel outward to attack the lateral structures of the knee.",
            4, "https://www.youtube.com/results?search_query=outside+heel+hook+bjj+nogi+leg+lock", Difficulty.ADVANCED
        ),
        Technique(
            408, "Inside Heel Hook", "Rotating the heel inward to attack the medial structures of the knee — highly dangerous.",
            4, "https://www.youtube.com/results?search_query=inside+heel+hook+bjj+mechanics+defense", Difficulty.ELITE
        ),
        Technique(
            409, "Straight Ankle Lock", "Applying pressure against the Achilles tendon to attack the ankle.",
            4, "https://www.youtube.com/results?search_query=straight+ankle+lock+bjj+fundamentals", Difficulty.BEGINNER
        ),
        Technique(
            410, "Kneebar", "Hyperextending the knee joint, similar to an armbar but on the leg.",
            4, "https://www.youtube.com/results?search_query=kneebar+bjj+submission+entry+technique", Difficulty.ADVANCED
        ),
        Technique(
            411, "Darce Choke", "Arm-in choke using a figure-4 through the neck, applied from turtle or guard.",
            4, "https://www.youtube.com/results?search_query=darce+choke+bjj+nogi+setup+finish", Difficulty.INTERMEDIATE
        ),
        Technique(
            412, "Anaconda Choke", "Similar to the Darce but with a different arm position, often from front headlock.",
            4, "https://www.youtube.com/results?search_query=anaconda+choke+bjj+front+headlock+nogi", Difficulty.INTERMEDIATE
        ),
        Technique(
            413, "Bow and Arrow Choke", "Powerful collar choke from the back using the belt/pants grip for finishing leverage.",
            4, "https://www.youtube.com/results?search_query=bow+and+arrow+choke+bjj+gi+back+control", Difficulty.INTERMEDIATE
        ),
        Technique(
            414, "Cross Collar Choke", "Double collar grip from mount or guard crossing over to choke.",
            4, "https://www.youtube.com/results?search_query=cross+collar+choke+bjj+mount+guard+gi", Difficulty.BEGINNER
        ),
        Technique(
            415, "Ezekiel Choke", "Sleeve-grip choke from mount, can even be applied inside the opponent's guard.",
            4, "https://www.youtube.com/results?search_query=ezekiel+choke+bjj+mount+technique", Difficulty.INTERMEDIATE
        ),
        Technique(
            416, "Americana (Keylock)", "Figure-4 shoulder lock bending the wrist upward — typically applied from mount or side control.",
            4, "https://www.youtube.com/results?search_query=americana+keylock+bjj+mount+side+control", Difficulty.BEGINNER
        ),

        // ── Takedowns & Throws (5xx) ────────────────────────────────────────
        Technique(
            501, "Double Leg Takedown", "Shooting in on both legs and driving to lift/trip the opponent to the ground.",
            5, "https://www.youtube.com/results?search_query=double+leg+takedown+wrestling+bjj", Difficulty.BEGINNER
        ),
        Technique(
            502, "Single Leg Takedown", "Controlling one leg and using trips or lifts to bring the opponent down.",
            5, "https://www.youtube.com/results?search_query=single+leg+takedown+bjj+wrestling+finish", Difficulty.BEGINNER
        ),
        Technique(
            503, "Hip Throw (O-goshi)", "Loading the opponent onto the hip and rotating to throw them to the ground.",
            5, "https://www.youtube.com/results?search_query=o+goshi+hip+throw+judo+bjj", Difficulty.BEGINNER
        ),
        Technique(
            504, "Seoi Nage (Shoulder Throw)", "Pulling the opponent over the shoulder for a large throw.",
            5, "https://www.youtube.com/results?search_query=seoi+nage+shoulder+throw+judo+bjj", Difficulty.INTERMEDIATE
        ),
        Technique(
            505, "Uchi Mata (Inner Thigh Throw)", "Sweeping inside the opponent's leg while breaking their balance.",
            5, "https://www.youtube.com/results?search_query=uchi+mata+judo+bjj+inner+thigh+throw", Difficulty.ADVANCED
        ),
        Technique(
            506, "Osoto Gari (Major Outer Reap)", "Reaping the opponent's leg from the outside while pushing them backward.",
            5, "https://www.youtube.com/results?search_query=osoto+gari+judo+bjj+outer+reap", Difficulty.BEGINNER
        ),
        Technique(
            507, "Ankle Pick", "Grabbing the ankle while pushing the head to trip the opponent.",
            5, "https://www.youtube.com/results?search_query=ankle+pick+bjj+wrestling+takedown", Difficulty.INTERMEDIATE
        ),
        Technique(
            508, "Fireman's Carry", "Loading the opponent across the back by gripping arm and ankle.",
            5, "https://www.youtube.com/results?search_query=fireman+carry+wrestling+bjj+takedown", Difficulty.ADVANCED
        ),

        // ── Escapes (6xx) ───────────────────────────────────────────────────
        Technique(
            601, "Bridge and Roll (Upa)", "Explosive bridge from mount to roll the opponent, recovering guard or taking top.",
            6, "https://www.youtube.com/results?search_query=upa+bridge+roll+escape+mount+bjj", Difficulty.BEGINNER
        ),
        Technique(
            602, "Elbow-Knee Escape (Shrimping)", "Creating space by shrimping the hips out and replacing guard from underneath.",
            6, "https://www.youtube.com/results?search_query=elbow+knee+escape+shrimp+bjj+mount", Difficulty.BEGINNER
        ),
        Technique(
            603, "Side Control Escape (Shrimp)", "Using the shrimp movement to recover guard from side control.",
            6, "https://www.youtube.com/results?search_query=side+control+escape+bjj+shrimp+recover+guard", Difficulty.BEGINNER
        ),
        Technique(
            604, "Back Escape", "Protecting the neck, working the seat belt off, and recovering guard from back control.",
            6, "https://www.youtube.com/results?search_query=back+escape+bjj+seat+belt+recover+guard", Difficulty.INTERMEDIATE
        ),
        Technique(
            605, "Guillotine Defense & Escape", "Posturing up, turning into the choke, and finding the neck to escape.",
            6, "https://www.youtube.com/results?search_query=guillotine+choke+defense+escape+bjj", Difficulty.INTERMEDIATE
        ),
        Technique(
            606, "Triangle Defense", "Stacking, posturing, and using grip breaks to escape the triangle choke.",
            6, "https://www.youtube.com/results?search_query=triangle+choke+defense+escape+bjj", Difficulty.INTERMEDIATE
        ),

        // ── Positions (7xx) ─────────────────────────────────────────────────
        Technique(
            701, "Mount", "Sitting on top of the opponent's torso — one of the most dominant positions in BJJ.",
            7, "https://www.youtube.com/results?search_query=mount+position+bjj+attacks+control", Difficulty.BEGINNER
        ),
        Technique(
            702, "Side Control", "Controlling the opponent from the side with chest-to-chest pressure.",
            7, "https://www.youtube.com/results?search_query=side+control+bjj+submissions+transitions", Difficulty.BEGINNER
        ),
        Technique(
            703, "Back Control", "Attaching to the opponent's back with hooks in, the most dangerous position in BJJ.",
            7, "https://www.youtube.com/results?search_query=back+control+bjj+seat+belt+hooks+finishing", Difficulty.INTERMEDIATE
        ),
        Technique(
            704, "North-South", "Controlling the opponent head-to-head, perpendicular to their body.",
            7, "https://www.youtube.com/results?search_query=north+south+position+bjj+control+submissions", Difficulty.INTERMEDIATE
        ),
        Technique(
            705, "Knee on Belly", "Driving the knee into the opponent's belly — a transitional and attacking position.",
            7, "https://www.youtube.com/results?search_query=knee+on+belly+bjj+attacks+pressure", Difficulty.BEGINNER
        ),
        Technique(
            706, "Turtle Position", "Defensive position on all fours — the opponent must break it open to attack.",
            7, "https://www.youtube.com/results?search_query=turtle+position+bjj+attacks+defense", Difficulty.BEGINNER
        )
    )

    val connections = listOf(
        // From Closed Guard → submissions
        TechniqueConnection(101, 401, ConnectionType.FOLLOW_UP),  // CG → Armbar
        TechniqueConnection(101, 402, ConnectionType.FOLLOW_UP),  // CG → Triangle
        TechniqueConnection(101, 403, ConnectionType.FOLLOW_UP),  // CG → Kimura
        TechniqueConnection(101, 404, ConnectionType.FOLLOW_UP),  // CG → Omoplata
        TechniqueConnection(101, 406, ConnectionType.FOLLOW_UP),  // CG → Guillotine
        // From Closed Guard → sweeps
        TechniqueConnection(101, 301, ConnectionType.FOLLOW_UP),  // CG → Hip Bump
        TechniqueConnection(101, 302, ConnectionType.FOLLOW_UP),  // CG → Scissor Sweep
        TechniqueConnection(101, 303, ConnectionType.FOLLOW_UP),  // CG → Flower Sweep

        // Submission triangles (combos)
        TechniqueConnection(402, 401, ConnectionType.FOLLOW_UP),  // Triangle → Armbar (when they defend)
        TechniqueConnection(402, 404, ConnectionType.FOLLOW_UP),  // Triangle → Omoplata
        TechniqueConnection(401, 402, ConnectionType.FOLLOW_UP),  // Armbar → Triangle
        TechniqueConnection(401, 404, ConnectionType.TRANSITION),  // Armbar → Omoplata
        TechniqueConnection(403, 406, ConnectionType.FOLLOW_UP),  // Kimura → Guillotine (sit-up)
        TechniqueConnection(403, 401, ConnectionType.FOLLOW_UP),  // Kimura → Armbar

        // Hip Bump → Kimura (when they post the hand)
        TechniqueConnection(301, 403, ConnectionType.FOLLOW_UP),  // Hip Bump → Kimura

        // Half Guard
        TechniqueConnection(102, 403, ConnectionType.FOLLOW_UP),  // Half Guard → Kimura
        TechniqueConnection(102, 406, ConnectionType.FOLLOW_UP),  // Half Guard → Guillotine (underhook)

        // Butterfly Guard
        TechniqueConnection(103, 304, ConnectionType.FOLLOW_UP),  // Butterfly → Butterfly Sweep
        TechniqueConnection(103, 411, ConnectionType.FOLLOW_UP),  // Butterfly → Darce
        TechniqueConnection(103, 403, ConnectionType.FOLLOW_UP),  // Butterfly → Kimura

        // De La Riva
        TechniqueConnection(105, 306, ConnectionType.FOLLOW_UP),  // DLR → Berimbolo
        TechniqueConnection(105, 307, ConnectionType.FOLLOW_UP),  // DLR → DLR Sweep
        TechniqueConnection(105, 703, ConnectionType.TRANSITION), // DLR → Back Control

        // X-Guard
        TechniqueConnection(106, 305, ConnectionType.FOLLOW_UP),  // X-Guard → X-Guard Sweep
        TechniqueConnection(109, 409, ConnectionType.FOLLOW_UP),  // SLX → Ankle Lock
        TechniqueConnection(109, 407, ConnectionType.FOLLOW_UP),  // SLX → Outside Heel Hook
        TechniqueConnection(109, 408, ConnectionType.FOLLOW_UP),  // SLX → Inside Heel Hook

        // Spider Guard
        TechniqueConnection(104, 402, ConnectionType.FOLLOW_UP),  // Spider → Triangle
        TechniqueConnection(104, 308, ConnectionType.FOLLOW_UP),  // Spider → Tripod Sweep

        // Lasso Guard
        TechniqueConnection(107, 404, ConnectionType.FOLLOW_UP),  // Lasso → Omoplata
        TechniqueConnection(107, 402, ConnectionType.FOLLOW_UP),  // Lasso → Triangle

        // From Mount
        TechniqueConnection(701, 401, ConnectionType.FOLLOW_UP),  // Mount → Armbar
        TechniqueConnection(701, 402, ConnectionType.FOLLOW_UP),  // Mount → Triangle
        TechniqueConnection(701, 414, ConnectionType.FOLLOW_UP),  // Mount → Cross Collar Choke
        TechniqueConnection(701, 415, ConnectionType.FOLLOW_UP),  // Mount → Ezekiel
        TechniqueConnection(701, 416, ConnectionType.FOLLOW_UP),  // Mount → Americana
        TechniqueConnection(701, 601, ConnectionType.COUNTER),    // Mount → Bridge and Roll (escape)
        TechniqueConnection(701, 602, ConnectionType.COUNTER),    // Mount → Elbow-Knee Escape

        // From Side Control
        TechniqueConnection(702, 403, ConnectionType.FOLLOW_UP),  // SC → Kimura
        TechniqueConnection(702, 416, ConnectionType.FOLLOW_UP),  // SC → Americana
        TechniqueConnection(702, 704, ConnectionType.TRANSITION), // SC → North-South
        TechniqueConnection(702, 705, ConnectionType.TRANSITION), // SC → Knee on Belly
        TechniqueConnection(702, 701, ConnectionType.TRANSITION), // SC → Mount
        TechniqueConnection(702, 603, ConnectionType.COUNTER),    // SC → Side Control Escape

        // From Back Control
        TechniqueConnection(703, 405, ConnectionType.FOLLOW_UP),  // Back → RNC
        TechniqueConnection(703, 413, ConnectionType.FOLLOW_UP),  // Back → Bow and Arrow

        // North-South
        TechniqueConnection(704, 403, ConnectionType.FOLLOW_UP),  // NS → Kimura
        TechniqueConnection(704, 412, ConnectionType.FOLLOW_UP),  // NS → Anaconda

        // Knee on Belly
        TechniqueConnection(705, 401, ConnectionType.FOLLOW_UP),  // KoB → Armbar
        TechniqueConnection(705, 402, ConnectionType.FOLLOW_UP),  // KoB → Triangle
        TechniqueConnection(705, 403, ConnectionType.FOLLOW_UP),  // KoB → Kimura

        // Takedowns → positions
        TechniqueConnection(501, 702, ConnectionType.TRANSITION), // Double Leg → Side Control
        TechniqueConnection(502, 702, ConnectionType.TRANSITION), // Single Leg → Side Control
        TechniqueConnection(503, 702, ConnectionType.TRANSITION), // Hip Throw → Side Control
        TechniqueConnection(504, 702, ConnectionType.TRANSITION), // Seoi Nage → Side Control
        TechniqueConnection(506, 702, ConnectionType.TRANSITION), // Osoto Gari → Side Control

        // Guard Passing → positions
        TechniqueConnection(201, 702, ConnectionType.TRANSITION), // Torreando → SC
        TechniqueConnection(202, 702, ConnectionType.TRANSITION), // Double Under → SC
        TechniqueConnection(203, 702, ConnectionType.TRANSITION), // Over-Under → SC
        TechniqueConnection(204, 702, ConnectionType.TRANSITION), // Leg Drag → SC
        TechniqueConnection(205, 702, ConnectionType.TRANSITION), // Knee Slice → SC
        TechniqueConnection(208, 407, ConnectionType.FOLLOW_UP),  // HQ → Outside Heel Hook
        TechniqueConnection(208, 409, ConnectionType.FOLLOW_UP),  // HQ → Ankle Lock

        // Turtle
        TechniqueConnection(706, 411, ConnectionType.FOLLOW_UP),  // Turtle → Darce
        TechniqueConnection(706, 412, ConnectionType.FOLLOW_UP),  // Turtle → Anaconda
        TechniqueConnection(706, 703, ConnectionType.TRANSITION), // Turtle → Back Control

        // Escapes leading back
        TechniqueConnection(601, 101, ConnectionType.TRANSITION), // Bridge&Roll → Closed Guard
        TechniqueConnection(602, 101, ConnectionType.TRANSITION), // Shrimp → Closed Guard
        TechniqueConnection(604, 101, ConnectionType.TRANSITION), // Back Escape → Closed Guard

        // Berimbolo → Back
        TechniqueConnection(306, 703, ConnectionType.TRANSITION), // Berimbolo → Back Control

        // HQ passes → leg locks
        TechniqueConnection(208, 408, ConnectionType.FOLLOW_UP)   // HQ → Inside Heel Hook
    )
}

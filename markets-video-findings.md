# Markets mobile video findings

The recording shows a vertically scrolling list of football market cards across multiple leagues. The user briefly scrolls down, then pulls down the Android notification shade; the notification shade is an operating-system interaction rather than an EdgeX defect.

The visible EdgeX problems are information overload inside each card, weak hierarchy between the main fixture context and secondary statistics, very small information/toggle controls, sticky league headers consuming too much space, and no visible in-app bottom navigation during the recorded Markets route. The scroll itself is generally predictable, although the league-header transitions appear slightly stuttered. The next repair should prioritize a compact summary card, a clear “view details” action, touch targets of at least 44px, less persistent league-header height, and a discoverable in-app navigation path.

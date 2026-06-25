"""RetailPulse dashboard pages.

Each module exposes a single ``render(ctx)`` function. ``ctx`` is a dict with:
    data     -> dict of DataFrames (transactions, customers, products, daily)
    theme    -> active palette dict (utils.styling)
    settings -> user settings dict
    search   -> current global search query string
"""

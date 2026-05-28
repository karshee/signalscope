from setuptools import setup, find_packages

setup(
    name="tapwire",
    version="0.1.0",
    description="Watch any Telegram channel. Extract any signal.",
    packages=find_packages(),
    entry_points={
        "console_scripts": [
            "tapwire=cli.main:main",
        ],
    },
    install_requires=[
        "telethon>=1.36.0",
        "python-dotenv>=1.0.1",
    ],
    python_requires=">=3.10",
)

# Sales Bonus Project

This project is designed to analyze sales data and calculate revenue and bonuses for sellers based on their performance.

## Files Overview

- **src/main.js**: Contains functions for calculating revenue and bonuses based on sales data.
  - `calculateSimpleRevenue(purchase, _product)`: Calculates revenue for a single item in a purchase.
  - `calculateBonusByProfit(index, total, seller)`: Calculates the seller's bonus based on their profit and ranking.
  - `analyzeSalesData(data, options)`: Main function that analyzes sales data, checks input validity, prepares intermediate data, processes purchase records, sorts sellers by profit, and assigns bonuses.

- **package.json**: Configuration file for npm, listing dependencies and scripts for the project.

## Usage

To use this project, ensure you have Node.js installed. You can then install the necessary dependencies and run the analysis using the provided functions in `src/main.js`.

## Contributing

Feel free to contribute to this project by submitting issues or pull requests. Your feedback and contributions are welcome!
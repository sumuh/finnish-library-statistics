# Finnish library statistics project

This is a project for the course Interactive Data Visualization in spring 2023.

## Link to website

https://finnish-library-statistics-production.up.railway.app/

## Data sources

I used a Finnish municipalities TopoJSON and converted it into GeoJSON. The TopoJSON is originally from [this Github page](<https://github.com/lucified/finland-municipalities-topojson>).

For the loan statistics, I used the column "loans / population" ("kokonaislainaus / asukasluku") from [Finnish Library Statistics](https://tilastot.kirjastot.fi/yearlyreports.php). The total amount of loans (kokonaislainaus) includes loans ordered from other municipalities' libraries to the municipality in question (kaukolainat). 

[Municipality mergers](https://fi.wikipedia.org/wiki/Kuntaliitos_Suomessa) might add some discrepancy to the data, since the municipalities that the statistics are given for vary across the years. The map is from 2017, after which two mergers have occurred: Valtimo merged into Nurmes and Honkajoki into Kankaanpää. The borders are therefore slightly outdated. Note that data is not available for municipalities in Ahvenanmaa.

## Using the app

The map of Finland can be zoomed and panned with the mouse. Clicking on municipalities selects them and adds them to a bar chart for better comparison. You can also type a municipality's name into the search box; pressing enter or clicking on the search button will select/deselect the typed municipality.

import bs4 as bs
import urllib.request
import pandas as pd
import time
import datetime
import numpy as np
 
   
def get_ticker(ticker, date1, date2):
  
    format_string='%Y-%m-%d %H:%M:%S'
  
    # One day (86400 second) adjustment required to get dates printed to match web site manual output
    _date1 = date1.strftime("%Y-%m-%d 00:00:00")
    date1_epoch = str(int(time.mktime(time.strptime(_date1, format_string)))- 86400)
    #print("")
    #print(date1, date1_epoch, " + 86,400 = ", str(int(date1_epoch) + 86400))
  
    _date2 = date2.strftime("%Y-%m-%d 00:00:00")
    date2_epoch = str(int(time.mktime(time.strptime(_date2, format_string))))
    #print(date2, date2_epoch)
  
    url = 'https://finance.yahoo.com/quote/' + ticker + '/history?period1=' + date1_epoch + '&period2=' + date2_epoch + '&interval=1d&filter=history&frequency=1d'
    source = urllib.request.urlopen(url).read()      
    soup = bs.BeautifulSoup(source,'lxml')
    tr = soup.find_all('tr')
       
    data = []
       
    for table in tr:
        td = table.find_all('td')
        row = [i.text for i in td]
        data.append(row)        
       
    columns = ['Date', 'Open', 'High', 'Low', 'Close', 'Adj Close', 'Volume']
   
    data = data[1:-2]
    df = pd.DataFrame(data)
    df.columns = columns
    df.set_index(columns[0], inplace=True)
    df = df.convert_objects(convert_numeric=True)
    df = df.iloc[::-1]
    # for i in df.index:
    #     df['Adj Close'][i] = float(df['Adj Close'][i])
    df.dropna(inplace=True)
       
    return df

def scrap(ticker, start_date, end_date, save_csv_data = False):
    today = datetime.date.today()

    # Initialize 'date1'
    date1 = start_date
    
    # Do not allow the 'End Date' to be AFTER today
    if today < end_date:
        end_date = today
    
    iteration_number = 0
    while date1 <= end_date:
        iteration_number += 1
    
        # Create 'date2' in a 60 day Window or less
        date2 = date1 + datetime.timedelta(days=60)
        date2 = datetime.date(date2.year, date2.month, 1)
        date2 = date2 - datetime.timedelta(days=1)
            
        # Do not allow 'date2' to go beyond the 'End Date'
        if date2 > end_date:
            date2 = end_date
            
        #print("Processing {} thru {}.".format(date1, date2))
        df = get_ticker(ticker, date1, date2)
        
        if iteration_number == 1:
            dfall = df.copy()
        else:
            frames = [dfall, df]
            dfall = pd.concat(frames)
    
        # Increment the first date for the next pass
        date1 = date1 + datetime.timedelta(days=60)
        date1 = datetime.date(date1.year, date1.month, 1)

    if save_csv_data:
        dfall.to_csv("{}_{}_{}.csv".format(ticker, start_date, end_date))
    return dfall

def get_data(ticker = "AAPL", start = None, end = None, save_csv_data = False, load_csv = False):
    if start == None:
        start_date = datetime.date(2016, 1, 1)
    if end == None:
        end_date = datetime.date.today()
    if load_csv:
        df = pd.read_csv("{}_{}_{}.csv".format(ticker, start_date, end_date))
    else:
        df = scrap(ticker, start_date, end_date, save_csv_data)

    prices = df['Adj Close'].values
    p = []
    for _p in prices:
        if type(_p) != str:
            p.append(_p)
    p = (p - np.mean(p))/np.std(p)

    RESULTS = {'states': [], 'rewards': []}
    for i in range(len(p)):
        if i >= 270:
            s = [0,0]
            if p[i] < np.mean(p[i-270:i]) - 0.5*np.std(p[i-270:i]):
                s[0] = 1
            elif p[i] > np.mean(p[i-270:i]) + 0.5*np.std(p[i-270:i]):
                s[0] = 3
            else:
                s[0] = 2
            if p[i] < np.mean(p[i-90:i]) - 0.5*np.std(p[i-90:i]):
                s[0] *= 1
            elif p[i] > np.mean(p[i-90:i]) + 0.5*np.std(p[i-90:i]):
                s[0] *= 3
            else:
                s[0] *= 2
            s[0] -= 1

            if p[i] < np.mean(p[i-30:i]) - 0.5*np.std(p[i-30:i]):
                s[1] = 1
            elif p[i] > np.mean(p[i-30:i]) + 0.5*np.std(p[i-30:i]):
                s[1] = 3
            else:
                s[1] = 2
            if p[i] < np.mean(p[i-10:i]) - 0.5*np.std(p[i-10:i]):
                s[1] *= 1
            elif p[i] > np.mean(p[i-10:i]) + 0.5*np.std(p[i-10:i]):
                s[1] *= 3
            else:
                s[1] *= 2
            s[1] -= 1
            
            if i == len(p)-1:
                RESULTS['final_state'] = {'x': s[0], 'y': s[1]}
            else:
                RESULTS['states'].append({'x': s[0], 'y': s[1]})
                RESULTS['rewards'].append(p[i+1]-p[i])
    return RESULTS


if __name__=="__main__":
    
    # January 3, 2018 = 1514955600  (seconds since UNIX epoch in 1970)
    # June   12, 2018 = 1528776000
    # https://finance.yahoo.com/quote/AAPL/history?period1=1514955600&period2=1528776000&interval=1d&filter=history&frequency=1d

    print("")
    start_date = datetime.date(2005, 1, 3)
    end_date = datetime.date(2018, 6, 12)
    today = datetime.date.today()
    
    # The statements in this group are for debugging purposes only
    format_string='%Y-%m-%d %H:%M:%S'
    t1 = start_date.strftime("%Y-%m-%d 00:00:00")
    t2 = end_date.strftime("%Y-%m-%d 00:00:00")
    start_date_epoch = str(int(time.mktime(time.strptime(t1, format_string))))
    end_date_epoch = str(int(time.mktime(time.strptime(t2,format_string))))
    
    
    # Output all 'original' dates
    print('Today     :', today)
    print('Start Date:', start_date, 'Start Date Epoch:', start_date_epoch)
    print('End   Date:', end_date,   'End   Date Epoch:', end_date_epoch)
    
    dfall = scrap("AAPL", start_date, end_date)
    
    print(dfall)
    print("len of dfall = {}".format(len(dfall)))

import os, json
import yahoo_finance_scraper
# Flask is the class used to create instances of web application
from flask import Flask, render_template, flash, request
from wtforms import Form, TextField, TextAreaField, validators, StringField, SubmitField, IntegerField
# __name__ is a special variable that gets as value the string "__main__" when you’re executing the script
# App config.
DEBUG = True
app = Flask(__name__)
app.config.from_object(__name__)
app.config['SECRET_KEY'] = '7d441f27d441f27567d441f2b6176a'

class ReusableForm(Form):
    t = TextField('Stock Ticker Symbol', validators=[validators.DataRequired()])

@app.route('/') # tell Flask what URL should trigger our function
def about():
    return render_template('about.html')

@app.route('/learn', methods=['GET', 'POST'])
def learn():
    form = ReusableForm(request.form)
    ticker = "GOOG" # default to scrap google
    if request.method == 'POST':
        ticker = request.form['ticker']
        #print(ticker)
        # if not form.validate():
        #     flash('Error: All Fields are Required')
        with open('static/data/data.json', 'w') as f:  # writing JSON object
            json.dump(yahoo_finance_scraper.get_data(ticker = ticker), f)
        flash('Finished craping ' + ticker + '!')

    return render_template('learn.html', form=form)

if __name__ == '__main__':
    app.run(debug = DEBUG) # debug: print out possible Python errors on the web page 
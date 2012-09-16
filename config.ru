# -*- mode: ruby -*-

require 'sinatra/base'

class App < Sinatra::Base
  set :public_folder, '.'

  get '/*' do
    File.read('index.html')
  end
end

class NoCache
  def initialize(app)
    @app = app
  end

  def call(env)
    response = @app.call(env)
    response[1].merge!('Cache-Control' => 'must-revalidate')
    return response
  end
end

use NoCache
run App

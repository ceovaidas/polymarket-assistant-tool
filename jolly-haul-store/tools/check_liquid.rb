# Parse every Liquid file of a built theme with Shopify's Liquid gem in strict mode,
# catching syntax Shopify's upload rejects ("file contains Liquid templates that can't be parsed").
#   gem install liquid && ruby tools/check_liquid.rb <unzipped theme dir>
require 'liquid'

class PassBlock < Liquid::Block; end
class PassTag < Liquid::Tag; end
env = Liquid::Environment.default
%w[form paginate style stylesheet javascript].each { |t| env.register_tag(t, PassBlock) }
env.register_tag('schema', Liquid::Raw)
%w[section sections layout].each { |t| env.register_tag(t, PassTag) }

# Shopify-only syntax the gem doesn't know (Dawn uses it): `{% render block %}`.
SHOPIFY_ONLY = /Template name must be a quoted string in "block"/

bad = 0
%w[sections snippets layout templates].each do |dir|
  Dir["#{ARGV.fetch(0)}/#{dir}/*.liquid"].sort.each do |f|
    begin
      Liquid::Template.parse(File.read(f, encoding: 'UTF-8'), error_mode: :strict)
    rescue Liquid::Error => e
      next if e.message =~ SHOPIFY_ONLY
      bad += 1
      puts "#{dir}/#{File.basename(f)}: #{e.message}"
    end
  end
end
puts bad.zero? ? 'Liquid OK' : "#{bad} file(s) with errors"
exit(bad.zero? ? 0 : 1)

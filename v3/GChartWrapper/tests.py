#!/usr/bin/env python
# -*- coding: utf-8 -*-
from GChartWrapper import *
from GChartWrapper.encoding import Encoder
from GChartWrapper.constants import PY_VER,_print
import unittest

class TestChartTypes(unittest.TestCase):
    """
    Extensive unit tests, more are welcome
    
    All methods should be commented and must return a GChart instance as the last line.
    """
    # All is dict of (name : checksum) pairs
    all = {
        'currency_bar':'8ec06bda7223eb500e7f0357efd6e717543d9abb', 
        'financial':'0c3dee619eb6c43d8b5405f537438467a7d736e5', 
        'text_pin':'42558403a2a9d66e9b54deea094114029c86d529', 
        'simple':'1fb72aac2758d164bca43a40472ae185091291b1', 
        'text':'4e1f2755c9f6160d959ed91829543e0687b55a0e', 
        'guide_granularity_20':'1dfcb2ba4444e3c09be3b55221cc04e5a5c0bf32', 
        'pie':'3fe7636938cda678be044848799a2c87ecad6099', 
        'small_bubble_icon':'65d1df5f7bda98cfaea2a96dfe8dcca1058c444c', 
        'guide_granularity_40':'dc7d8714f28d7a59d2b768ecba7f685814a73bd4', 
        'guide_radar':'9703b8ca52e8c38c37353c6935d5053f8120c37a', 
        'icon_pin':'01110b589dbe1ed9aed7a3eb057bd9020b6d21a2', 
        'guide_sparkline':'767bab6609f60b6c7185b0ed0a1434ad9d73f4c7', 
        'guide_bhg':'b051f7ab51afd534f89095fab7db3c161fcb3bc3', 
        'margins':'4f995e40b16a49d0c407c0bf1b536f7642f6253d', 
        'venn':'cf327d123a3a2fdf04620a966903fc20f096f82c', 
        'fill':'1766f4b8b774d41985a4a3b2ab3f9791dedab2a3', 
        'guide_line_lc':'11ec3b84d8de22e8bf6a32cbca3b62374aa68a46', 
        'large_bubble_icon_texts':'20c705a0e3038594749b8b9cdf8f09e470e76b17', 
        'large_bubble_texts':'ff1474c87defa687727a4ee42dca9c641a46668c', 
        'guide_granularity_300':'0d5a40563ad832312bd357564a9da9787e38d6ef', 
        'large_bubble_icon':'f09ebedf3cc5c461604539afdcff9dac09817d71', 
        'adv_icon_pin':'b8a2ec08aeb3fb0a839598a82dfba02c7cdc8638', 
        'axes':'6040f894d8e71160b9e87541f7ef9db224efae9c', 
        'qr_code':'bdcea2f3b1dbb331de2ed8a730736c99f2d81c90', 
        'markers':'fc7ab02d17a07a611a02b0a4dda7763c4bfec712', 
        'guide_granularity_80':'014f1a251dab5fa14fdadf7868b64a210bb1cf5e', 
        'axes_position':'7d6d5d0fa5565ef3e1069ba91db472484a339696', 
        'jacobian':'6d0d251ac640c0d5185124cb5ea9ccc636268f14', 
        'multiline':'5f27957e39363ca470c0e97d1fcffdc19fa00afb', 
        'numpy':'9b0fb89df43d69b64755153b919e598180fc1a9d', 
        'guide_meter':'cdad708a80c49b705212d098bf83f9ccb30610aa', 
        'letter_pin':'430c921aa8d73e80feae07b2ba04909c6a6b1ab3', 
        'guide_granularity_150':'35281ef165d532021290c003e2068527d40003b0', 
        'guide_intro':'0b3b189c0675fd51bda46714706e3f7dfb4164dc', 
        'thought_note':'9375cabf12b442764db34862c68ae74f85c42ca9', 
        'czech_and_unicode':'ead386ad75dabb21e13fd4b3a357d6025bdd4506', 
        'guide_bvg':'36ce2efaf74fad1912b8351147b821d0253f9c56', 
        'min_max':'5aae24644331ca33c0cb83dc01a34d389edd6adf', 
        'guide_bhs':'a1d1801762105d58f67c544be36e2af7bf69a2a8', 
        'guide_map':'2391235ee09f58cc194eaf16b3c87f839613ebc5', 
        'guide_bvs':'e65f1bea45ae7197943366d8de1268aad6e5b66d', 
        'grid':'90953636424f46e568bf8a316efbba4df0461eef', 
        'legend2':'acc8c1a1199e2363fee076486365b6f8a29e72a0', 
        'line':'9b6f9a566b49fa23c91a6f992e4a4737caac4ae5', 
        'guide_chbh_size':'a6b043ed705fe90afef78c393403fc813ca7aa1e', 
        'legend':'33cd2c7acdc4aa9745ed95a0aa1ff641525adf5c', 
        'adv_letter_pin':'97cd7dac85adad57e2cf8209d0795a4f5216cb6a', 
        'sticky_note':'a3a55893fc130abd814c80c9841e3547e2c2877a', 
        'bar':'d3251fb77a28a5918955020c745fa435b0f4a314', 
        'bar_text':'c01b4efa34a4850f6888ebcde3d9ee28ba621f85', 
        'title':'40d64c1c3aeb9c3836e501033c4bf65da2ff2f83', 
        'tick_marks':'9cab6532523a353cd87d3edec45d9222de9dde5d', 
        'concentric_pie':'cb6325bb97779fabdc77c8ab76e6bf4ed1d5447b', 
        'hvz':'7a890b9c2c6016faff3cb6789d9732a5caf8fa9d', 
        'guide_chbh_clipped':'83ff879fc173bbcf80350d62d7d880b619424d10', 
        'guide_bvs_scale':'a327b4be8fa55deccba5b4baab7680c75f621064', 
        'weather_note':'9a7988231bc235bda5ab21e19288fba5b554adf7', 
        'markerfill':'95664c2d4aeae5bcb94b1b003b361e2035d44e64',
        'packman':'2cd25d4a258abb9d62d144668e3cb54f71b01af1',
        'interval':'5e60f45fb27f32aefe048d9eb22f17a7d117c162',
        'bar_zero':'94219f27b54883078db0ef744292a40e46de2da7',
        'omitted_colors':'bc72f51d748767fc1692b6a227d5184415e9e2f5',
        'scatter':'36f99c6a7e93af8d164af220ae626c10002f808e',
        'fancy_radar':'049d0fe4a213204e8e31f07658c7a665ea866698',
        'legend_position':'5f2d550e98ae1a85312b4d7e33761d30ca89acfd',
        'circle_diamonds':'0e02091bfe03d6cf31704c87de01dea6c47e3717',
    }

    def __init__(self, *a, **kw):
        super(TestChartTypes, self).__init__(*a, **kw)

    def _test_a_chart(self, rep, chart):
        chart_name = rep.split('test_')[1][:-1]
        self.assertEqual(self.all[chart_name], chart.checksum(),
                        '%s: %s != %s'%(chart_name,self.all[chart_name],chart.checksum()))

    def test_scatter(self):
        G = Scatter([[12,87,75,41,23,96,68,71,34,9],[98,60,27,34,56,79,58,74,18,76],[84,23,69,81,47,94,60,93,64,54]])
        G.axes('xy')
        G.axes.label(0, 0,20,30,40,50,60,70,80,90,10)
        G.axes.label(1, 0,25,50,75,100)
        G.size(300,200)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_fancy_radar(self):
        G = RadarSpline(['voJATd9v','MW9BA9'],encoding='simple')
        G.color('red','orange')
        G.size(400,400)
        G.line(2,4,0)
        G.line(2,4,0)
        G.axes('x')
        G.axes.label(0, 0,45,90,135,180,225,270,315)
        G.axes.range(0, 0.0,360.0)
        G.grid(25.0,25.0,4.0,4.0)
        G.marker('B','FF000080',0,1.0,5.0)
        G.marker('B','FF990080',1,1.0,5.0)
        G.marker('h','blue',0,1.0,4.0)
        G.marker('h','3366CC80',0,0.5,5.0)
        G.marker('V','00FF0080',0,1.0,5.0)
        G.marker('V','008000',0,5.5,5.0)
        G.marker('v','00A000',0,6.5,4)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_omitted_colors(self):
        G = Line([[20,10,15,25,17,30],[0,5,10,7,12,6],[35,25,45,47,24,46],[15,40,30,27,39,54],[70,55,63,59,80,60]],encoding='text',series=1)
        G.scale(0,100,-50,100)
        G.marker('F','',1,'1:4',20)
        self._test_a_chart(repr(self), G)
        return G        
    
    def test_bar_zero(self):
        G = VerticalBarGroup([20,35,50,10,95],encoding='text')
        G.color('cc0000')
        G.position(.5)
        self._test_a_chart(repr(self), G)
        return G

    def test_interval(self):
        G = Line('cEAELFJHUc',encoding='simple')
        G.color('76A4FB')
        G.line(2)
        G.axes('x')
        G.axes.range(0,10,50,5)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_packman(self):
        G = Pie([80,20])
        G.orientation(0.628)
        G.color('yellow','white')
        self._test_a_chart(repr(self), G)
        return G
    
    def test_simple(self):
        # Instantiate the GChart instance, this is all you will need for making charts
        # GChart(type=None, dataset=None), see the doc for more
        G = GChart()
        # Set the chart type, either Google API type or regular name
        G.type('pie')
        # Update the chart's dataset, can be two dimensional or contain string data
        G.dataset( 'helloworld' )
        # Set the size of the chart, default is 300x150
        G.size(250,100)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_hvz(self):
        # Make a vertical bar group and scale it to the max
        G = VerticalBarGroup( [[31],[59],[4]], encoding='text' )
        G.scale(0,59)
        G.color('lime','red','blue')
        G.legend('Goucher(31)','Truman(59)','Kansas(4)')
        G.fill('c','lg',45,'cccccc',0,'black',1)
        G.fill('bg','s','cccccc')        
        G.size(200,100)
        self._test_a_chart(repr(self), G)
        return G

    def test_qr_code(self):
        # Output a QR code graph that allows 15% restore with 0 margin
        # *Defaults to UTF-8 encoding 
        G = QRCode('''To the human eye QR Codes look like hieroglyphics, 
            but they can be read by any device that has 
            the appropriate software installed.''')
        # or use output_encoding method
        G.output_encoding('UTF-8')
        # level_data(error_correction,margin_size)
        G.level_data('M',0)
        self._test_a_chart(repr(self), G)
        return G
        
    def test_title(self):
        # Title using name with optional color and size
        G = Line( ['GurMrabsClgubaolGvzCrgrefOrnhgvshyvforggregunahtyl'] )
        G.title('The Zen of Python','00cc00',36)
        G.color('00cc00')
        self._test_a_chart(repr(self), G)
        return G
        
    def test_line(self):
        # Add red line 6 thick
        # with 5 line segments with 2 blank segments
        G = Line( ['hX1xPj'] )
        G.axes('xy')
        G.axes.label(0, 'Mar', 'Apr', 'May', 'June', 'July')
        G.axes.label(1, None, '50+Kb')        
        G.color('red')
        G.line(6,5,2)
        self._test_a_chart(repr(self), G)
        return G

    def test_bar(self):
        # 2 color horizontal bars 10 wide
        # with 5 spacing between bars in group and 10 between groups
        G = HorizontalBarGroup( ['hell','orld'] )
        G.color('cc0000', '00aa00') 
        G.bar(10,5,10)   
        self._test_a_chart(repr(self), G) 
        return G
    
    def test_pie(self):
        # Simple pie chart based on list
        G = Pie3D( [1,2,3,4] )
        G.label('A','B','C','D')
        G.color('00dd00') 
        self._test_a_chart(repr(self), G)
        return G

    def test_venn(self):
        # Extended venn diagram based on int list, scale the data to the max value
        G = Venn( [100,80,60,30,30,30,10], encoding='text')
        G.scale(0,100)
        self._test_a_chart(repr(self), G)
        return G
 
    def test_axes(self):
        # Call type first with the chxt
        # then call label and style in order, 
        # label can contain None(s)
        G = Line( ['foobarbaz'] )
        G.color('76A4FB') 
        G.axes('xyrx')
        G.axes.label(0,'Foo', 'Bar', 'Baz')
        G.axes.style(0, '0000dd', 14)
        G.axes.label(1, None, '20K', '60K', '100K')  
        G.axes.label(2, 'A', 'B', 'C')  
        G.axes.label(3, None,'20','40','60','80')      
        self._test_a_chart(repr(self), G)  
        return G

    def test_grid(self):
        # Create dashed line with grid x,y as floats
        # then, just like line, the line and blank segments
        G = Line( ['foobarbaz'] )
        G.color('76A4FB')   
        G.line(3,6,3)
        G.grid(20.0,25.0,1,0)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_markers(self):
        # Mark up some of the data randomly
        G = Line( ['helloWorldZZZZ098236561'] )
        G.marker('c','red',0,1,20)
        G.marker('d','80C65A',0,6,15)    
        G.marker('o','FF9900',0,4.0,20.0)
        G.marker('s','3399CC',0,5.0,10.0)
        G.marker('v','BBCCED',0,6.0,1.0)
        G.marker('V','3399CC',0,7.0,1.0)
        G.marker('x','FFCC33',0,8.0,20.0)
        G.marker('h','black',0,0.30,0.5 )       
        G.marker('a','000099',0,4,10)
        G.marker('R','A0BAE9',0,8,0.6)    
        G.marker('r','E5ECF9',0,1,0.25)
        self._test_a_chart(repr(self), G)     
        return G
        
    def test_jacobian(self):     
        # from http://toys.jacobian.org/hg/googlecharts/raw-file/tip/docs/examples.html  
        G = Line(['ALAtBmC1EcGYIsLWOXRuVdZhd9ivn4tYzO5b..'],encoding='extended')
        G.size(300,200)
        G.color('cc0000')
        G.fill('c','s','eeeeee')
        G.legend('Sweet')
        self._test_a_chart(repr(self), G)
        return G
    
    def test_markerfill(self):
        # Fill the chart areas with markers
        G = Line( ['99','cefhjkqwrlgYcfgc',
            'QSSVXXdkfZUMRTUQ','HJJMOOUbVPKDHKLH','AA'] )
        G.marker('b','76A4FB',0,1,0)
        G.marker('b','224499',1,2,0)
        G.marker('b','red',2,3,0)
        G.marker('B','80C65A',3,4,0)
        self._test_a_chart(repr(self), G)    
        return G

    def test_fill(self):
        # Fill the chart/background using chf, add axes to show bg 
        G = Line( ['pqokeYONOMEBAKPOQVTXZdecaZcglprqxuux393ztpoonkeggjp'] )
        G.color('red')
        G.line(4,3,0)
        G.axes('xy') 
        G.axes.label(0, 1,2,3,4,5)
        G.axes.label(1, None,50,100)
        G.fill('c','lg',45,'white',0,'76A4FB',0.75)
        G.fill('bg','s','EFEFEF')
        self._test_a_chart(repr(self), G)    
        return G


    def test_legend(self):
        # Add legend to the data set which follows collors
        G = Line( ['FOETHECat','leafgreen','IRON4YOUs'] )  
        G.color('red','lime','blue')
        G.legend('Animals','Vegetables','Minerals')
        G.axes('y') 
        self._test_a_chart(repr(self), G)
        return G

    def test_legend2(self):
        # Add a left aligned legend to the chart
        G = Line( ['abcde','FGHIJ','09876'] )  
        G.color('red','lime','blue')
        G.legend('Animals','Vegetables','Minerals')
        G.legend_pos('l')
        G.axes('y') 
        self._test_a_chart(repr(self), G)
        return G

    def test_legend_position(self):
        # Place the legend in the top position
        G = Venn([100,20,20,20,20,0,0])
        G.legend('First','Second','Third')
        G.legend_pos('t')
        G.color('red','lime','blue')
        self._test_a_chart(repr(self), G)
        return G
    
    def test_multiline(self):
        # Draw multiple lines with markers on an lxy chart
        G = LineXY( [ 
            [0,30,60,70,90,95,100], # x values
            [20,30,40,50,60,70,80], # y values, etc.
            [10,30,40,45,52],
            [100,90,40,20,10],
            ['-1'], # domain not found, interpolated
            [5,33,50,55,7],
        ])
        G.scale(0,100)
        G.color('3072F3','red','00aaaa')
        G.marker('s','red',0,-1,5)
        G.marker('s','blue',1,-1,5)
        G.marker('s','00aa00',2,-1,5)   
        G.line(2,4,1)   
        self._test_a_chart(repr(self), G)
        return G

    def test_axes_position(self):
        # multiple axis with label positions specified
        # values between 0 and 100 - use text encoding
        data = [[4.6, 6.0, 7.4, 11.6, 12.0, 14.8, 18.1, 25.1, 
                 27.9, 28.3, 30.6, 34.4, 43.7, 48.3, 57.6, 64.6, 
                 72.5, 74.4, 76.2, 77.2, 86.0, 86.9, 93.9, 96.7, 99.0], 
                [80.5, 100.0, 95.4, 93.7, 96.3, 91.7, 71.5, 63.0, 
                 65.2, 65.5, 66.0, 75.9, 65.8, 64.4, 64.2, 62.5, 37.2, 
                 35.3, 32.4, 35.2, 38.4, 37.9, 69.8, 38.0, 64.5]]
        
        # positions between 0 and 100
        axis = [ [0, 13, 28, 42, 56, 71, 84, 100],
                 ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] ]
        
        # don't do integer arithmetic
        min_value = float(min(data[1]))
        max_value = float(max(data[1]))
        last_value = float(data[1][-1])
        
        G = LineXY(data, encoding='text')
        G.color('76A4FB')
        G.marker('o', '0077CC',0,-1,5)
        G.marker('r', 'E6F2FA',0,(min_value/max_value),1.0) # 0 to 1.0
        G.axes("xyr")    
        G.axes.label(0, *axis[1])
        G.axes.position(0, *axis[0])
        G.axes.label(1, '%d'%min_value, '%d'%max_value)    
        G.axes.position(1, int(100*min_value/max_value),100) # 0 to 100
        G.axes.label(2, '%d'%last_value)
        G.axes.position(2, int(100*last_value/max_value)) # 0 to 100
        self._test_a_chart(repr(self), G)        
        return G

    # Examples from the Google Chart API Developer's Guide
    # http://code.google.com/apis/chart/

    def test_guide_intro(self):
        G = Pie3D([60,40], encoding='text')
        G.size(250,100)
        G.label('Hello', 'World')
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_granularity_20(self):
        G = Line('fohmnytenefohmnytene', encoding='simple')
        G.size(200,100)
        G.axes('xy')
        G.axes.label(0, 'April','May','June')
        G.axes.label(1, None, '50+Kb')
        self._test_a_chart(repr(self), G)        
        return G

    def test_guide_granularity_40(self):
        G = Line('frothsmzndyoteepngenfrothsmzndyoteepngen', encoding='simple')
        G.size(200,100)
        G.axes('xy')
        G.axes.label(0, 'April','May','June')
        G.axes.label(1, None, '50+Kb')
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_granularity_80(self):
        G = Line('formostthisamazingdayfortheleapinggreenlformostthisamazingdayfortheleapinggreenl',
            encoding='simple')
        G.size(200,100)
        G.axes('xy')
        G.axes.label(0, 'April','May','June')
        G.axes.label(1, None, '50+Kb')
        self._test_a_chart(repr(self), G)
        return G
    
    def test_guide_granularity_150(self):
        G = Line('ithankYouGodformostthisamazingdayfortheleapinggreenlyspiritsoftreesandabluetruedreamofskyandforeverythingwhichisnaturalwhichisinfinitewhichisyeseecumm',
            encoding='simple')
        G.size(200,100)
        G.axes('xy')
        G.axes.label(0, 'April','May','June')
        G.axes.label(1, None, '50+Kb')
        self._test_a_chart(repr(self), G)
        return G
    
    def test_guide_granularity_300(self):
        G = Line('ithankYouGodformostthisamazingdayfortheleapinggreenlyspiritsoftreesandabluetruedreamofskyandforeverythingwhichisnaturalwhichisinfinitewhichisyesithankYouGodformostthisamazingdayfortheleapinggreenlyspiritsoftreesandabluetruedreamofskyandforeverythingwhichisnaturalwhichisinfinitewhichisyeseecummings',
            encoding='simple')
        G.size(200,100)
        G.axes('xy')
        G.axes.label(0, 'April','May','June')
        G.axes.label(1, None, '50+Kb')
        self._test_a_chart(repr(self), G)
        return G
    
    def test_guide_line_lc(self):
        # http://code.google.com/apis/chart/#line_charts
        G = Line('fooZaroo', encoding='simple')
        G.size(200,100)
        self._test_a_chart(repr(self), G)
        return G

        
    
    def test_guide_sparkline(self):
        # http://code.google.com/apis/chart/#sparkline  
        G = Sparkline([27,25,25,25,25,27,100,31,25,36,25,25,39,
            25,31,25,25,25,26,26,25,25,28,25,25,100,28,27,31,25,
            27,27,29,25,27,26,26,25,26,26,35,33,34,25,26,25,36,25,
            26,37,33,33,37,37,39,25,25,25,25], encoding='text')
        G.color('0077CC')
        G.size(200,40)
        G.marker('B', 'E6F2FA',0,0,0)
        G.line(1,0,0)
        self._test_a_chart(repr(self), G)
        return G

    
    def test_guide_bhs(self):
        # http://code.google.com/apis/chart/#bar_charts
        G = HorizontalBarStack('ello', encoding='simple')
        G.color('4d89f9')
        G.size(200,125)        
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_bvs(self):
        G = VerticalBarStack([ [10,50,60,80,40],[50,60,100,40,20] ], encoding='text')
        G.color('4d89f9', 'c6d9fd')
        G.size(200,125)
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_bvs_scale(self):
        G = VerticalBarStack([ [10,50,60,80,40],[50,60,100,40,20] ], encoding='text')
        G.color('4d89f9', 'c6d9fd')
        G.size(200,125)
        G.scale(0,160)
        self._test_a_chart(repr(self), G)
        return G
        
    def test_guide_bhg(self):
        G = HorizontalBarGroup(['el','or'], encoding='simple')
        G.color('4d89f9','c6d9fd')
        G.size(200,125)
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_bvg(self):
        G = VerticalBarGroup(['hello','world'], encoding='simple')
        G.color('4d89f9','c6d9fd')
        G.size(200,125)
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_chbh_clipped(self):
        G = HorizontalBarStack('hello', encoding='simple')
        G.color('4d89f9')
        G.size(200,125)
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_chbh_size(self):
        G = HorizontalBarStack('hello', encoding='simple')
        G.color('4d89f9')
        G.size(200,125)
        G.bar(10)
        self._test_a_chart(repr(self), G)
        return G
   
    def test_guide_radar(self):
        # Create a radar chart w/ multiple lines
        G = Radar([ [77,66,15,0,31,48,100,77],[20,36,100,2,0,100] ], encoding='text')  
        G.size(200,200)
        G.color('red','FF9900')
        G.line(2,4,0)
        G.line(2,4,0)        
        G.axes('x')
        G.axes.label(0, 0,45,90,135,180,225,270,315)
        G.axes.range(0, 0,360)
        self._test_a_chart(repr(self), G)
        return G
 
    def test_guide_map(self):
        # Make a map of the US as in the API guide
        G = Map('fSGBDQBQBBAGABCBDAKLCDGFCLBBEBBEPASDKJBDD9BHHEAACAC', encoding='simple')
        G.color('f5f5f5','edf0d4','6c9642','365e24','13390a')
        G.fill('bg','s','eaf7fe')
        G.size(440,220)
        G.map('usa', 'NYPATNWVNVNJNHVAHIVTNMNCNDNELASDDCDEFLWAKSWIORKYMEOHIAIDCTWYUTINILAKTXCOMDMAALMOMNCAOKMIGAAZMTMSSCRIAR')
        self._test_a_chart(repr(self), G)
        return G

    def test_guide_meter(self):
        # Create a simple Google-O-Meter with a label
        G = Meter(70)
        G.label('Hello')
        G.size(225,125)
        self._test_a_chart(repr(self), G)
        return G

    def test_numpy(self):
        # Test to see whether numpy arrays work correctly
        # Must have numpy installed to do this test correctly
        data = [10,20,30,40,50,60,70,80,90]
        try:
            from numpy import array
            data = array(data)
        except ImportError:
            _print('Warning: numpy must be installed to do this test correctly')
        G = Radar(data, encoding='text')
        G.size(200,200)    
        self._test_a_chart(repr(self), G)
        return G

    def test_concentric_pie(self):
        # Using concentric pie charts
        G = PieC(['Helo','Wrld'], encoding='simple')
        G.size(200,100)
        self._test_a_chart(repr(self), G)
        return G
        
    def test_financial(self):
        # Fancy markers for financial data
        G = Line([[0,5,10,7,12,6],[35,25,45,47,24,46],[15,40,30,27,39,54],[70,55,63,59,80,60]], encoding='text')
        G.marker('F','blue',0,'1:4',20)
        G.size(200,125)
        self._test_a_chart(repr(self), G)
        return G
        
    def test_bar_text(self):
        # Using text markers in a bar chart
        G = HorizontalBarGroup([[40,60],[50,30]], encoding='text')
        G.size(200,125)
        G.marker('tApril mobile hits','black',0,0,13)
        G.marker('tMay mobile hits','black',0,1,13,-1)
        G.marker('tApril desktop hits','black',1,0,13)
        G.marker('tMay desktop hits', 'black',1,1,13)
        G.color('FF9900','FFCC33')
        self._test_a_chart(repr(self), G)
        return G
        
    def test_margins(self):
        G = Line(['Uf9a','a3fG'], encoding='simple')
        G.size(250,100)
        G.label(1,2,3,4)
        G.fill('bg','s','e0e0e0')
        G.color('black','blue')
        G.margin(20,20,20,30,80,20)
        G.legend('Temp','Sales')
        self._test_a_chart(repr(self), G)
        return G
        
    def test_min_max(self):
        G = Line('mHMza', encoding='simple')
        G.color('008000')
        G.line(2.0,4.0,1.0)
        G.size(200,140)
        G.axes('x')
        G.axes.label(0, None,'t',None,'F',None)
        G.marker('tMin','blue',0,1,10)
        G.marker('fMax','red',0,3,15)
        G.margin(0,0,30,0)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_text(self):
        # Make a text chart label w/ any text you like
        # Google automagically ignores white space and spaces text correctly
        text = '''
        1600 Ampitheatre Parkway
        Mountain View, CA
        (650)+253-0000
        '''
        G = Text('darkred',16,'h','red','b',text)
        self._test_a_chart(repr(self), G)
        return G
        
    def test_letter_pin(self):
        # Simple map pin w/ a letter/number
        G = Pin('pin_letter','A','red','black')
        self._test_a_chart(repr(self), G)
        return G

    def test_icon_pin(self):
        # Map pin w/ a certain icon
        G = Pin('pin_icon','home','yellow')
        self._test_a_chart(repr(self), G)
        return G

    def test_adv_letter_pin(self):
        G = Pin('xpin_letter','star','A','aqua','black','red')
        self._test_a_chart(repr(self), G)
        return G

    def test_adv_icon_pin(self):
        # Map pin w/ cool icon
        G = Pin('xpin_icon','star','home','aqua','red')
        self._test_a_chart(repr(self), G)
        return G

    def test_text_pin(self):
        # Straight up map pin w/ following text
        G = Pin('spin',1.2,30,'FFFF88',10,'_','Foo\nBar')
        self._test_a_chart(repr(self), G)
        return G
        
    def test_sticky_note(self):
        # Note w/ title and text 
        G = Note('note_title','pinned_c',1,'darkgreen','l',"Joe's\nToday 2-for-1 !\n555-1234")
        self._test_a_chart(repr(self), G)
        return G

    def test_thought_note(self):
        # Thought bubble note
        G = Note('note','thought',1,'navy','h',"wouldn't it be\ngreat to eat\nat Joe's?")
        self._test_a_chart(repr(self), G)
        return G

    def test_weather_note(self):
        # First example w/ true utf-8 encoding
        G = Note('weather','taped_y','sunny','Barcelona','max 25°','min 15°')
        self._test_a_chart(repr(self), G)
        return G
        
    def test_small_bubble_icon(self):
        # Small bubble marker
        G = Bubble('icon_text_small','petrol','bb','$3/gal','khaki','black')
        self._test_a_chart(repr(self), G)
        return G

    def test_large_bubble_icon(self):
        # Larger bubble marker
        G = Bubble('icon_text_big','snack','bb','$2.99','ffbb00','black')
        self._test_a_chart(repr(self), G)   
        return G

    def test_large_bubble_icon_texts(self):
        # Large bubble marker w/ icon and multiline text
        G = Bubble('icon_texts_big','petrol','bb','khaki','black','LoCost Fuel\n$3.05/gal unleaded\n$2.10/gal diesel')
        self._test_a_chart(repr(self), G)
        return G

    def test_large_bubble_texts(self):
        # Large bubble marker with just text
        G = Bubble('texts_big','bb','teal','khaki',"Joe\'s Restaurant\n123 Long St\n92745 Mountain View")
        self._test_a_chart(repr(self), G)
        return G
    
    def test_czech_and_unicode(self):
        # Submitted by anedvedicky
        G = VerticalBarStack( [[10], [20], [30]], encoding = 'text')
        G.color('green','lime','red')
        G.label('šýŽěůčář...')
        G.legend('šýŽěůčář...','∫µ≤','´®†¥¨ˆøπ¬˚≤µ˜')
        self._test_a_chart(repr(self), G)
        return G

    def test_tick_marks(self):
        G = Line('cEAELFJHHHKUju9uuXUc', encoding="simple")
        G.color('76A4FB')
        G.size(220, 125)
        G.line(2)
        G.axes('xyrx')
        G.axes.range(1, 0,4)
        G.axes.label(2, 'min','avg','max')
        G.axes.label(3, 'Jan','Feb','Mar')
        G.axes.style(2, '0000DD',13,-1,'t','FF0000')
        G.axes.position(2, 10,35,95)
        G.axes.tick(1,10)
        G.axes.tick(2,-180)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_currency_bar(self):
        G = VerticalBarStack([43.56,35.62,48.34,57.50,67.30,60.91])
        G.color('blue')
        G.bar(17,15)
        G.marker('N*cEUR1*','black',0,-1,11)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_circle_diamonds(self):
        G = Line(['Hello','world'])
        G.marker('o','ff9900',0,-1,15.0)
        G.marker('d','ff0000',1,-1,10.0)
        self._test_a_chart(repr(self), G)
        return G
    
    def test_fromstring(self):
        url='http://chart.apis.google.com/chart?cht=p3&chd=t:60,40&chs=250x100&chl=Hello|World'
        self.assertEqual(GChart.fromurl(url).checksum(),'4e53c7add42ce61a933ce106a9854222c54c9147')

    def _test_encoding(self, encoding, expected, data, scale):
        codec = Encoder(encoding, scale)
        self.assertEqual(codec.encode(data), expected)
        self.assertEqual(codec.decode(codec.encode(data)), [data])
        
    def test_simple_encode(self):
        self._test_encoding('simple', 's:Ab9', [0,27,61], 61)
        
    def test_text_encode(self):
        self._test_encoding('text', 't:0.0,10.0,100.0,-1.0,-1.0', [0,10,100,-1,-1], (0,100))
   
    def test_extended_encode(self):
        self._test_encoding('extended', 'e:AH-HAA..', [7,3975,0,4095], 4095)

def get_chart(chart):
    return getattr(TestChartTypes('test_%s'%chart), 'test_%s'%chart)()

def saveall():
    import os
    if not os.path.isdir('tests'):
        os.mkdir('tests')
    for chart in TestChartTypes.all:
        chartobj = get_chart(chart)
        chartobj.save('tests/%s'%chart)

if __name__ == '__main__':
    import sys
    calls = {
        'unit': lambda: unittest.main(),
        'save': lambda: saveall(),
    }
    arg = sys.argv[-1]
    sys.argv = sys.argv[:-1]
    if arg in calls:
        calls[arg]()
    else:
        for chart in TestChartTypes.all:
            _print( chart,'\t',get_chart(chart))
